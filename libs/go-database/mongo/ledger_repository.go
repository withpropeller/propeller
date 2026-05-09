package mongo

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/propeller/propeller/libs/go-common/helpers"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/writeconcern"
)

var (
	ErrSignatureExists           = errors.New("signature already exists")
	ErrInvalidOrMissingMetaField = errors.New("invalid or missing _meta field")
	ErrHashVerificationFailed    = errors.New("hash verification failed")
	ErrNotFound                  = errors.New("entity not found")
)

type LedgerVerifyOptions struct {
	// Limit the number of history records to verify
	Limit *int64
}

type LedgerWriteOptions struct {
	// Additional meta data to be added to the entity
	Meta *bson.M

	// Signature to be added to the entity
	Signature *string

	// InsertionId is the id of the entity to be created/updated/deleted
	InsertionId *primitive.ObjectID

	// OrigId is the original id of the entity
	OrigId *primitive.ObjectID

	// TxTime is the time of the transaction
	TxTime *primitive.DateTime

	// VerifyHash is a flag to verify the hash of the entity before operation
	VerifyHash *bool
}

type LedgerRepository struct {
	MongoRepository
	model *mongo.Collection
}

func NewLedgerRepository(model *mongo.Collection) *LedgerRepository {
	return &LedgerRepository{MongoRepository: *NewMongoRepository(model), model: model}
}

func (r *LedgerRepository) LedgerUpdateById(entityId primitive.ObjectID, update bson.M, opts ...*LedgerWriteOptions) (*primitive.ObjectID, error) {
	wOpts := MergeLedgerWriteOptions(opts...)
	historyCollection := r.model.Name() + "_history"

	if wOpts.VerifyHash != nil && *wOpts.VerifyHash {
		verified, err := r.LedgerVerifyById(entityId)
		if err != nil {
			return nil, err
		}

		if !verified {
			return nil, ErrHashVerificationFailed
		}
	}

	// add update meta
	updateSet := bson.M{
		"_meta.op":     "update",
		"_meta.nonce":  helpers.RandomString(32),
		"_meta.txTime": *wOpts.TxTime,
	}
	updateInc := bson.M{"_meta.seqNo": 1}

	if update["$set"] == nil {
		update["$set"] = updateSet
	} else {
		update["$set"] = helpers.MergeBsonMaps(update["$set"].(bson.M), updateSet)
	}

	if update["$inc"] == nil {
		update["$inc"] = updateInc
	} else {
		update["$inc"] = helpers.MergeBsonMaps(update["$inc"].(bson.M), updateInc)
	}

	// add additional meta to update
	if wOpts.Meta != nil {
		prefixedMap := prefixMetaMapKeys(*wOpts.Meta)
		update["$set"] = helpers.MergeBsonMaps(update["$set"].(bson.M), prefixedMap)
	}

	// create transaction session
	txnOptions := options.Transaction().SetWriteConcern(writeconcern.New(writeconcern.WMajority()))
	session, err := r.model.Database().Client().StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(context.Background())

	result, err := session.WithTransaction(context.Background(), func(ctx mongo.SessionContext) (interface{}, error) {
		// check if signature exists
		if wOpts.Signature != nil {
			countFilter := bson.M{"_meta.origId": entityId, "_meta.signature": *wOpts.Signature}
			count, err := r.model.Database().Collection(historyCollection).CountDocuments(ctx, countFilter)
			if err != nil {
				return nil, err
			}

			if count > 0 {
				return nil, ErrSignatureExists
			}

			// add signature to update
			update["$set"].(bson.M)["_meta.signature"] = *wOpts.Signature
		}

		// update entity
		doc := bson.M{}
		opts := options.FindOneAndUpdate().SetReturnDocument(options.After)
		if err := r.model.FindOneAndUpdate(ctx, bson.M{"_id": entityId}, update, opts).Decode(doc); err != nil {
			if err == mongo.ErrNoDocuments {
				return nil, ErrNotFound
			}
			return nil, err
		}

		prevHash := doc["_meta"].(bson.M)["hash"]
		doc["_meta"].(bson.M)["prevHash"] = prevHash
		computedPlain, computedHash := computeEntityHash(doc)

		computedPlain["_meta"].(bson.M)["hash"] = computedHash

		// insert history
		computedPlain["_id"] = wOpts.InsertionId
		insertRes, err := r.model.Database().Collection(historyCollection).InsertOne(ctx, computedPlain)
		if err != nil {
			return nil, err
		}

		// update entity with new hash
		entityUpdate := bson.M{"$set": bson.M{"_meta.hash": computedHash, "_meta.prevHash": prevHash}}
		if _, err := r.model.UpdateByID(ctx, entityId, entityUpdate); err != nil {
			return nil, err
		}

		return insertRes.InsertedID, nil

	}, txnOptions)

	if err != nil {
		return nil, errors.New("session transaction failed: " + err.Error())
	}

	insertedId := result.(primitive.ObjectID)

	return &insertedId, nil

}

func (r *LedgerRepository) LedgerInsert(doc bson.M, opts ...*LedgerWriteOptions) (*primitive.ObjectID, error) {
	wOpts := MergeLedgerWriteOptions(opts...)
	historyCollection := r.model.Name() + "_history"

	doc["_meta"] = bson.M{
		"nonce":    helpers.RandomString(32),
		"op":       "insert",
		"origId":   wOpts.OrigId,
		"prevHash": "",
		"seqNo":    1,
		"txTime":   *wOpts.TxTime,
	}

	if wOpts.Meta != nil {
		doc["_meta"] = helpers.MergeBsonMaps(doc["_meta"].(bson.M), *wOpts.Meta)
	}

	_, computedHash := computeEntityHash(doc)
	doc["_meta"].(bson.M)["hash"] = computedHash

	// create transaction session
	txnOptions := options.Transaction().SetWriteConcern(writeconcern.New(writeconcern.WMajority()))
	session, err := r.model.Database().Client().StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(context.Background())

	result, err := session.WithTransaction(context.Background(), func(ctx mongo.SessionContext) (interface{}, error) {

		insertedRes, err := r.model.InsertOne(ctx, helpers.MergeBsonMaps(bson.M{"_id": wOpts.OrigId}, doc))
		if err != nil {
			return nil, err
		}

		_, err = r.model.Database().Collection(historyCollection).InsertOne(ctx, helpers.MergeBsonMaps(bson.M{"_id": wOpts.InsertionId}, doc))
		if err != nil {
			return nil, err
		}

		return insertedRes.InsertedID, nil

	}, txnOptions)

	if err != nil {
		return nil, err
	}

	insertedId := result.(primitive.ObjectID)

	return &insertedId, nil
}

func (r *LedgerRepository) LedgerVerifyById(entityId primitive.ObjectID, opts ...*LedgerVerifyOptions) (bool, error) {
	var ctx = context.Background()
	vOpts := MergeLedgerVerifyOptions(opts...)
	historyCollection := r.model.Name() + "_history"
	var prevHash string
	var mainEntityComputedHash string
	var historyFound bool

	mainEntity := bson.M{}
	if err := r.FindOneById(ctx, entityId, mainEntity); err != nil {
		if err == mongo.ErrNoDocuments {
			mainEntity = nil
		} else {
			return false, err
		}
	}

	if mainEntity != nil {
		mainEntityHash := mainEntity["_meta"].(bson.M)["hash"]
		_, mainEntityComputedHash = computeEntityHash(mainEntity)
		if mainEntityComputedHash != mainEntityHash {
			return false, nil
		}
	}

	// Build aggregation pipeline for efficient processing of large datasets
	pipeline := mongo.Pipeline{
		// Match stage - filter by origId
		{{Key: "$match", Value: bson.M{"_meta.origId": entityId}}},

		// Sort stage - sort by seqNo in descending order
		{{Key: "$sort", Value: bson.M{"_meta.seqNo": -1}}},

		// Limit stage - apply the specified limit to prevent memory issues
		{{Key: "$limit", Value: *vOpts.Limit}},
	}

	// Execute the pipeline with disk use enabled for large datasets
	// and batchSize to control memory usage and network roundtrips
	aggOpts := options.Aggregate().
		SetAllowDiskUse(true).
		SetBatchSize(100) // Process documents in small batches to avoid memory pressure

	cursor, err := r.model.Database().Collection(historyCollection).Aggregate(
		context.Background(),
		pipeline,
		aggOpts,
	)
	if err != nil {
		return false, err
	}
	defer cursor.Close(context.Background())

	var docs []bson.M
	for cursor.Next(context.Background()) {
		historyFound = true
		doc := bson.M{}
		err = cursor.Decode(&doc)
		if err != nil {
			return false, err
		}
		docs = append(docs, doc)
	}

	for i := len(docs) - 1; i >= 0; i-- {
		docHash := docs[i]["_meta"].(bson.M)["hash"].(string)
		docPrevHash := docs[i]["_meta"].(bson.M)["prevHash"].(string)
		_, computedHash := computeEntityHash(docs[i])
		if prevHash == "" {
			prevHash = docPrevHash
		}

		if docHash != computedHash {
			return false, nil
		}

		if prevHash != docPrevHash {
			return false, nil
		}
		prevHash = docHash
	}

	if mainEntityComputedHash != "" {
		return prevHash == mainEntityComputedHash, nil
	}

	return historyFound, nil
}

func (r *LedgerRepository) LedgerDeleteById(entityId primitive.ObjectID, opts ...*LedgerWriteOptions) (*primitive.ObjectID, error) {
	var ctx = context.Background()
	wOpts := MergeLedgerWriteOptions(opts...)
	historyCollection := r.model.Name() + "_history"

	if wOpts.VerifyHash != nil && *wOpts.VerifyHash {
		verified, err := r.LedgerVerifyById(entityId)
		if err != nil {
			return nil, err
		}

		if !verified {
			return nil, ErrHashVerificationFailed
		}
	}

	var doc bson.M
	if err := r.FindOneById(ctx, entityId, doc); err != nil {
		return nil, errors.New(r.model.Name() + " not found")
	}

	meta, ok := doc["_meta"].(bson.M)
	if !ok || meta == nil {
		return nil, ErrInvalidOrMissingMetaField
	}

	meta["nonce"] = helpers.RandomString(32)
	meta["op"] = "delete"
	meta["prevHash"] = meta["hash"]
	meta["seqNo"] = meta["seqNo"].(int) + 1
	meta["txTime"] = *wOpts.TxTime

	if wOpts.Meta != nil {
		meta = helpers.MergeBsonMaps(meta, *wOpts.Meta)
		doc["_meta"] = meta
	}

	computedPlain, computedHash := computeEntityHash(doc)
	computedPlain["_meta"].(bson.M)["hash"] = computedHash

	// create transaction session
	txnOptions := options.Transaction().SetWriteConcern(writeconcern.New(writeconcern.WMajority()))
	session, err := r.model.Database().Client().StartSession()
	if err != nil {
		return nil, err
	}
	defer session.EndSession(context.Background())

	result, err := session.WithTransaction(context.Background(), func(ctx mongo.SessionContext) (interface{}, error) {

		deleted, err := r.model.DeleteOne(ctx, bson.M{"_id": entityId})
		if err != nil {
			return nil, err
		}
		if deleted.DeletedCount == 0 {
			return nil, mongo.ErrNoDocuments
		}

		computedPlain["_id"] = wOpts.InsertionId
		insertResult, err := r.model.Database().Collection(historyCollection).InsertOne(ctx, computedPlain)
		if err != nil {
			return nil, err
		}

		return insertResult.InsertedID, nil

	}, txnOptions)

	if err != nil {
		return nil, err
	}

	insertedId := result.(primitive.ObjectID)

	return &insertedId, nil
}

func computeEntityHash(entity bson.M) (bson.M, string) {

	delete(entity, "_id")
	delete(entity, "__v")
	if entity["_meta"] != nil {
		delete(entity["_meta"].(bson.M), "hash")
	}

	sortedEntity := helpers.SortMapKeys(entity)
	sortedEntity["_meta"] = helpers.SortMapKeys(sortedEntity["_meta"].(bson.M))

	b, _ := json.Marshal(sortedEntity)

	hash := helpers.Hash256(string(b))

	return entity, hash
}

// MergeLedgerWriteOptions combines the given LedgerWriteOptions instances into a single LedgerWriteOptions in a last-one-wins
// fashion.
func MergeLedgerWriteOptions(opts ...*LedgerWriteOptions) *LedgerWriteOptions {
	defaults := &LedgerWriteOptions{
		InsertionId: helpers.Ptr(primitive.NewObjectID()),
		OrigId:      helpers.Ptr(primitive.NewObjectID()),
		TxTime:      helpers.Ptr(primitive.NewDateTimeFromTime(time.Now().UTC())),
	}

	for _, ioo := range opts {
		if ioo == nil {
			continue
		}

		if ioo.VerifyHash != nil {
			defaults.VerifyHash = ioo.VerifyHash
		}

		if ioo.Meta != nil {
			defaults.Meta = ioo.Meta
		}

		if ioo.Signature != nil {
			defaults.Signature = ioo.Signature
		}

		if ioo.InsertionId != nil {
			defaults.InsertionId = ioo.InsertionId
		}

		if ioo.OrigId != nil {
			defaults.OrigId = ioo.OrigId
		}

		if ioo.TxTime != nil {
			defaults.TxTime = ioo.TxTime
		}
	}

	return defaults
}

// MergeLedgerVerifyOptions combines the given LedgerVerifyOptions instances into a single LedgerVerifyOptions in a last-one-wins
// fashion.
// If no limit is provided, it defaults to 1000.
func MergeLedgerVerifyOptions(opts ...*LedgerVerifyOptions) LedgerVerifyOptions {
	ioOpts := LedgerVerifyOptions{
		Limit: helpers.Ptr(int64(1000)),
	}
	for _, ioo := range opts {
		if ioo == nil {
			continue
		}
		if ioo.Limit != nil {
			ioOpts.Limit = ioo.Limit
		}
	}

	return ioOpts
}

// prefixMetaMapKeys prefixes the keys of the given metaMap with "_meta."
func prefixMetaMapKeys(metaMap bson.M) bson.M {
	prefixedMap := bson.M{}
	for k, v := range metaMap {
		prefixedMap["_meta."+k] = v
	}
	return prefixedMap
}
