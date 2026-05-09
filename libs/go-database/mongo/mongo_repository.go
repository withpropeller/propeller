package mongo

import (
	"context"

	"github.com/propeller/propeller/libs/go-common/helpers"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Repository interface {
	Aggregate(pipeline interface{}, results interface{}, opts ...*options.AggregateOptions) error
	Count(filter interface{}) (int64, error)
	DeleteMany(filter interface{}) error
	DeleteOne(filter interface{}) error
	Find(filter interface{}, results interface{}, opts ...*options.FindOptions) error
	FindAndPerform(filter interface{}, perform func(c *mongo.Cursor) (interface{}, error), opts ...*options.FindOptions) (interface{}, error)
	FindIds(ids []string, results interface{}, opts ...*options.FindOptions) error
	FindObjectIds(ids []primitive.ObjectID, results interface{}, opts ...*options.FindOptions) error
	FindOne(filter interface{}, result interface{}, opts ...*options.FindOneOptions) error
	FindOneAndUpdate(filter interface{}, update interface{}, result interface{}, opts ...*options.FindOneAndUpdateOptions) error
	FindOneById(objectId primitive.ObjectID, result interface{}, opts ...*options.FindOneOptions) error
	FindOneByIdHex(id string, result interface{}, opts ...*options.FindOneOptions) error
	FindOneByTagId(id string, result interface{}, opts ...*options.FindOneOptions) error
	InsertMany(documents []interface{}, opts ...*options.InsertManyOptions) (*mongo.InsertManyResult, error)
	GetCollection() *mongo.Collection
	GetCollectionName() string
	InsertOne(ctx context.Context, document interface{}, opts ...*options.InsertOneOptions) (*mongo.InsertOneResult, error)
	UpdateMany(filter interface{}, update interface{}, opts ...*options.UpdateOptions) error
	UpdateManyByIds(objectIds []primitive.ObjectID, update interface{}, opts ...*options.UpdateOptions) error
	UpdateOne(filter interface{}, update interface{}, opts ...*options.UpdateOptions) error
	UpdateOneById(objectId primitive.ObjectID, update interface{}, opts ...*options.UpdateOptions) error
}

type MongoRepository struct {
	collection *mongo.Collection
}

func NewMongoRepository(collection *mongo.Collection) *MongoRepository {
	return &MongoRepository{collection}
}

func (r MongoRepository) GetCollectionName() string {
	return r.collection.Name()
}

func (r MongoRepository) GetCollection() *mongo.Collection {
	return r.collection
}

func (r MongoRepository) FindOneByIdHex(id string, result interface{}, opts ...*options.FindOneOptions) error {
	var ctx = context.Background()
	objectId, _ := primitive.ObjectIDFromHex(id)

	return r.FindOneById(ctx, objectId, result, opts...)
}

func (r MongoRepository) Count(filter interface{}) (int64, error) {

	ctx := context.Background()

	return r.collection.CountDocuments(ctx, filter)
}

func (r MongoRepository) FindOneByTagId(id string, result interface{}, opts ...*options.FindOneOptions) error {

	hex, err := helpers.TagIdToHex(id)
	if err != nil {
		return err
	}

	return r.FindOneByIdHex(*hex, result, opts...)
}

func (r MongoRepository) FindOneById(ctx context.Context, objectId primitive.ObjectID, result interface{}, opts ...*options.FindOneOptions) error {
	return r.collection.FindOne(ctx, bson.M{"_id": bson.M{"$eq": objectId}}, opts...).Decode(result)
}

func (r MongoRepository) FindOne(ctx context.Context, filter interface{}, result interface{}, opts ...*options.FindOneOptions) error {
	return r.collection.FindOne(ctx, filter, opts...).Decode(result)
}

func (r MongoRepository) FindOneAndUpdate(ctx context.Context, filter interface{}, update interface{}, result interface{}, opts ...*options.FindOneAndUpdateOptions) error {

	opts = append(opts, options.FindOneAndUpdate().SetReturnDocument(options.After))
	return r.collection.FindOneAndUpdate(ctx, filter, update, opts...).Decode(result)
}

// FindOneAndUpdateById finds a document by its ObjectID and applies the specified update, returning the updated document.
func (r MongoRepository) FindAndUpdateById(ctx context.Context, objectId primitive.ObjectID, update interface{}, result interface{}, opts ...*options.FindOneAndUpdateOptions) error {
	opts = append(opts, options.FindOneAndUpdate().SetReturnDocument(options.After))
	return r.collection.FindOneAndUpdate(ctx, bson.M{"_id": bson.M{"$eq": objectId}}, update, opts...).Decode(result)
}

func (r MongoRepository) UpdateOneById(ctx context.Context, objectId primitive.ObjectID, update interface{}, opts ...*options.UpdateOptions) error {
	_, err := r.collection.UpdateByID(ctx, objectId, update, opts...)
	return err
}

func (r MongoRepository) UpdateById(ctx context.Context, objectId primitive.ObjectID, update interface{}, opts ...*options.UpdateOptions) error {
	_, err := r.collection.UpdateByID(ctx, objectId, update, opts...)
	return err
}

func (r MongoRepository) UpdateOne(ctx context.Context, filter interface{}, update interface{}, opts ...*options.UpdateOptions) error {
	_, err := r.collection.UpdateOne(ctx, filter, update, opts...)
	return err
}

func (r MongoRepository) UpdateMany(filter interface{}, update interface{}, opts ...*options.UpdateOptions) error {
	ctx := context.Background()

	_, err := r.collection.UpdateMany(ctx, filter, update, opts...)
	return err
}

func (r MongoRepository) UpdateManyByIds(objectIds []primitive.ObjectID, update interface{}, opts ...*options.UpdateOptions) error {
	ctx := context.Background()

	_, err := r.collection.UpdateMany(ctx, bson.M{"_id": bson.M{"$in": objectIds}}, update, opts...)
	return err
}

func (r MongoRepository) DeleteOne(filter interface{}) error {
	ctx := context.Background()

	_, err := r.collection.DeleteOne(ctx, filter)
	return err
}

func (r MongoRepository) DeleteMany(filter interface{}) error {
	ctx := context.Background()

	_, err := r.collection.DeleteMany(ctx, filter)
	return err
}

func (r MongoRepository) Find(ctx context.Context, filter interface{}, results interface{}, opts ...*options.FindOptions) error {
	cursor, _ := r.collection.Find(ctx, filter, opts...)
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, results); err != nil {
		return err
	}

	return nil
}

func (r MongoRepository) FindIds(ctx context.Context, ids []string, results interface{}, opts ...*options.FindOptions) error {
	return r.FindObjectIds(ctx, helpers.StrToObjectIds(ids), results, opts...)
}

func (r MongoRepository) FindObjectIds(ctx context.Context, ids []primitive.ObjectID, results interface{}, opts ...*options.FindOptions) error {
	return r.Find(ctx, bson.M{"_id": bson.M{"$in": ids}}, results, opts...)
}

func (r MongoRepository) InsertOne(ctx context.Context, document interface{}, opts ...*options.InsertOneOptions) (*mongo.InsertOneResult, error) {
	return r.collection.InsertOne(ctx, document, opts...)
}

func (r MongoRepository) InsertMany(documents []interface{}, opts ...*options.InsertManyOptions) (*mongo.InsertManyResult, error) {
	ctx := context.Background()

	return r.collection.InsertMany(ctx, documents, opts...)
}

func (r MongoRepository) FindAndPerform(filter interface{}, perform func(c *mongo.Cursor) (interface{}, error), opts ...*options.FindOptions) (interface{}, error) {
	ctx := context.Background()

	cursor, _ := r.collection.Find(ctx, filter, opts...)
	defer cursor.Close(ctx)

	var result interface{}

	for cursor.Next(ctx) {
		res, err := perform(cursor)
		result = res
		if err != nil {
			return nil, err
		}
	}

	return result, nil
}

func (r MongoRepository) Aggregate(pipeline interface{}, results interface{}, opts ...*options.AggregateOptions) error {
	ctx := context.Background()

	cursor, err := r.collection.Aggregate(ctx, pipeline, opts...)
	if err != nil {
		return err
	}
	defer cursor.Close(ctx)

	if err := cursor.All(ctx, results); err != nil {
		return err
	}

	return nil
}

func FindAndReduce[T any](model *mongo.Collection, filter bson.M, fn func(prev T, c *mongo.Cursor) (*T, error), initial T, opts ...*options.FindOptions) (*T, error) {
	ctx := context.Background()

	cursor, _ := model.Find(ctx, filter, opts...)
	defer cursor.Close(ctx)

	result := initial

	for cursor.Next(ctx) {
		res, err := fn(result, cursor)
		if err != nil {
			return nil, err
		}
		if res != nil {
			result = *res
		}
	}

	return &result, nil
}
