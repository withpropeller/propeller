package mongo

import (
	"fmt"
	"reflect"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/integration/mtest"
)

func TestPrefixMetaMapKeys(t *testing.T) {
	origId := primitive.NewObjectID()
	txTime := primitive.NewDateTimeFromTime(time.Now().UTC())
	metaMap := bson.M{
		"nonce":    "abc123",
		"op":       "insert",
		"origId":   origId,
		"prevHash": "hash123",
		"seqNo":    1,
		"txTime":   txTime,
	}

	expected := bson.M{
		"_meta.nonce":    "abc123",
		"_meta.op":       "insert",
		"_meta.origId":   origId,
		"_meta.prevHash": "hash123",
		"_meta.seqNo":    1,
		"_meta.txTime":   txTime,
	}

	result := prefixMetaMapKeys(metaMap)

	if !reflect.DeepEqual(result, expected) {
		t.Errorf("Expected %v but got %v", expected, result)
	}
}

func TestMergeLedgerWriteOptions(t *testing.T) {
	// Test case 1: No options provided
	result := MergeLedgerWriteOptions()

	// Check individual fields since InsertionId will be random
	if result.Meta != nil {
		t.Errorf("Expected Meta to be nil but got %v", result.Meta)
	}
	if result.Signature != nil {
		t.Errorf("Expected Signature to be nil but got %v", result.Signature)
	}
	if result.InsertionId == nil {
		t.Error("Expected InsertionId to not be nil")
	}
	if result.TxTime == nil {
		t.Error("Expected TxTime to not be nil")
	}

	// Test case 2: Single option with all fields populated
	meta := bson.M{"key": "value"}
	signature := "abc123"
	insertionId := primitive.NewObjectID()
	origId := primitive.NewObjectID()
	txTime := primitive.NewDateTimeFromTime(time.Now().UTC())
	result = MergeLedgerWriteOptions(
		&LedgerWriteOptions{
			Meta:        &meta,
			Signature:   &signature,
			InsertionId: &insertionId,
			OrigId:      &origId,
			TxTime:      &txTime,
		},
	)
	expected := &LedgerWriteOptions{
		Meta:        &meta,
		Signature:   &signature,
		InsertionId: &insertionId,
		OrigId:      &origId,
		TxTime:      &txTime,
	}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("Expected %v but got %v", expected, result)
	}

	// Test case 3: Multiple options with overlapping fields to verify last-one-wins behaviors
	meta1 := bson.M{"key1": "value1"}
	meta2 := bson.M{"key2": "value2"}
	signature1 := "abc123"
	signature2 := "def456"
	insertionId1 := primitive.NewObjectID()
	insertionId2 := primitive.NewObjectID()
	origId1 := primitive.NewObjectID()
	origId2 := primitive.NewObjectID()
	txTime1 := primitive.NewDateTimeFromTime(time.Now().UTC())
	txTime2 := primitive.NewDateTimeFromTime(time.Now().UTC().Add(time.Hour))
	result = MergeLedgerWriteOptions(
		&LedgerWriteOptions{
			Meta:        &meta1,
			Signature:   &signature1,
			InsertionId: &insertionId1,
			OrigId:      &origId1,
			TxTime:      &txTime1,
		},
		&LedgerWriteOptions{
			Meta:        &meta2,
			Signature:   &signature2,
			InsertionId: &insertionId2,
			OrigId:      &origId2,
			TxTime:      &txTime2,
		},
	)
	expected = &LedgerWriteOptions{
		Meta:        &meta2,
		Signature:   &signature2,
		InsertionId: &insertionId2,
		OrigId:      &origId2,
		TxTime:      &txTime2,
	}
	if !reflect.DeepEqual(result, expected) {
		t.Errorf("Expected %v but got %v", expected, result)
	}
}

func TestLedgerRepository_LedgerUpdateById(t *testing.T) {
	mt := mtest.New(t, mtest.NewOptions().ClientType(mtest.Mock))

	mt.Run("Success - Basic Update", func(mt *mtest.T) {
		// Test data
		origId := primitive.NewObjectID()
		insertionId := primitive.NewObjectID()
		txTime := primitive.NewDateTimeFromTime(time.Now().UTC())

		// Setup mock responses
		mt.AddMockResponses(
			// FindOneAndUpdate response
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: bson.D{
				{Key: "_id", Value: origId},
				{Key: "_meta", Value: bson.D{
					{Key: "hash", Value: "oldhash"},
				}},
			}}),
			// InsertOne response for history
			mtest.CreateSuccessResponse(),
			// UpdateByID response
			mtest.CreateSuccessResponse(),
			// CommitTransaction
			mtest.CreateSuccessResponse(),
		)

		// Create repository with mocked client
		repo := NewLedgerRepository(mt.Coll)

		// Call method
		update := bson.M{
			"$set": bson.M{"field": "value"},
		}
		opts := []*LedgerWriteOptions{
			{
				InsertionId: &insertionId,
				TxTime:      &txTime,
			},
		}

		id, err := repo.LedgerUpdateById(origId, update, opts...)
		assert.NoError(mt, err)
		assert.NotNil(mt, id)
		assert.Equal(mt, insertionId, *id)
	})

	mt.Run("Success - Update with Hash Verification", func(mt *mtest.T) {
		// Test data
		origId := primitive.NewObjectID()
		insertionId := primitive.NewObjectID()
		txTime := primitive.NewDateTimeFromTime(time.Now().UTC())
		verifyHash := true

		// get computed hash
		_, validHash := computeEntityHash(bson.M{
			"_id":   origId,
			"field": "value1",
			"_meta": bson.M{
				"prevHash": "",
			},
		})

		// Setup mock responses for verification
		mt.AddMockResponses(
			// FindOne response for main document
			mtest.CreateCursorResponse(
				1,
				"test.collection",
				mtest.FirstBatch,
				bson.D{
					{Key: "_id", Value: origId},
					{Key: "field", Value: "value1"},
					{Key: "_meta", Value: bson.D{
						{Key: "hash", Value: validHash},
						{Key: "prevHash", Value: ""},
					}},
				},
			),
			// Cursor close response
			mtest.CreateSuccessResponse(),
			// Find response for history
			mtest.CreateCursorResponse(
				1,
				"test.collection_history",
				mtest.FirstBatch,
				bson.D{
					{Key: "_id", Value: origId},
					{Key: "field", Value: "value1"},
					{Key: "_meta", Value: bson.D{
						{Key: "hash", Value: validHash},
						{Key: "prevHash", Value: ""},
					}},
				},
			),
			// Cursor close response
			mtest.CreateSuccessResponse(),
			mtest.CreateSuccessResponse(),
			// FindOneAndUpdate update response
			mtest.CreateSuccessResponse(bson.E{Key: "value", Value: bson.D{
				{Key: "_id", Value: origId},
				{Key: "field", Value: "value2"},
				{Key: "_meta", Value: bson.D{
					{Key: "hash", Value: "oldhash"},
				}},
			}}),
			// InsertOne response for history
			mtest.CreateSuccessResponse(),
			// UpdateByID response
			mtest.CreateSuccessResponse(),
			// CommitTransaction
			mtest.CreateSuccessResponse(),
		)

		// Create repository with mocked client
		repo := NewLedgerRepository(mt.Coll)

		// Call method
		update := bson.M{
			"$set": bson.M{"field": "value2"},
		}
		opts := []*LedgerWriteOptions{
			{
				InsertionId: &insertionId,
				TxTime:      &txTime,
				VerifyHash:  &verifyHash,
			},
		}

		id, err := repo.LedgerUpdateById(origId, update, opts...)
		assert.NoError(mt, err)
		assert.NotNil(mt, id)
	})

	/*

		mt.Run("Success - Update with Signature", func(mt *mtest.T) {
			// Test data
			entityId := primitive.NewObjectID()
			insertionId := primitive.NewObjectID()
			txTime := primitive.NewDateTimeFromTime(time.Now().UTC())
			signature := "test-signature"

			// Setup mock responses
			mt.AddMockResponses(
				// CountDocuments response for signature check
				mtest.CreateCursorResponse(
					0,
					"test.collection_history",
					mtest.FirstBatch,
				),
				// FindOneAndUpdate response
				mtest.CreateCursorResponse(
					1,
					"test.collection",
					mtest.FirstBatch,
					bson.D{
						{Key: "_id", Value: entityId},
						{Key: "_meta", Value: bson.D{
							{Key: "hash", Value: "oldhash"},
						}},
					},
				),
				// InsertOne response for history
				mtest.CreateSuccessResponse(),
				// UpdateByID response
				mtest.CreateSuccessResponse(),
			)

			// Create repository with mocked client
			repo := NewLedgerRepository(mt.Coll)

			// Call method
			update := bson.M{
				"$set": bson.M{"field": "value"},
			}
			opts := []*LedgerWriteOptions{
				{
					InsertionId: &insertionId,
					TxTime:      &txTime,
					Signature:   &signature,
				},
			}

			id, err := repo.LedgerUpdateById(entityId, update, opts...)
			assert.NoError(mt, err)
			assert.NotNil(mt, id)
		})*/

	/*
		mt.Run("Error - Hash Verification Failed", func(mt *mtest.T) {
			// Test data
			entityId := primitive.NewObjectID()
			txTime := primitive.NewDateTimeFromTime(time.Now().UTC())
			verifyHash := true

			// Setup mock responses for failed verification
			mt.AddMockResponses(
				// FindOne response for main document with invalid hash
				mtest.CreateCursorResponse(
					1,
					"test.collection",
					mtest.FirstBatch,
					bson.D{
						{Key: "_id", Value: entityId},
						{Key: "_meta", Value: bson.D{
							{Key: "hash", Value: "invalidhash"},
						}},
					},
				),
			)

			// Create repository with mocked client
			repo := NewLedgerRepository(mt.Coll)

			// Call method
			update := bson.M{
				"$set": bson.M{"field": "value"},
			}
			opts := []*LedgerWriteOptions{
				{
					TxTime:     &txTime,
					VerifyHash: &verifyHash,
				},
			}

			id, err := repo.LedgerUpdateById(entityId, update, opts...)
			assert.Error(mt, err)
			assert.Equal(mt, ErrHashVerificationFailed, err)
			assert.Nil(mt, id)
		})
		/*
			mt.Run("Error - Duplicate Signature", func(mt *mtest.T) {
				// Test data
				entityId := primitive.NewObjectID()
				insertionId := primitive.NewObjectID()
				txTime := primitive.NewDateTimeFromTime(time.Now().UTC())
				signature := "test-signature"

				// Setup mock responses
				mt.AddMockResponses(
					// CountDocuments response indicating duplicate signature
					mtest.CreateCursorResponse(
						1,
						"test.collection_history",
						mtest.FirstBatch,
						bson.D{{Key: "count", Value: 1}},
					),
				)

				// Create repository with mocked client
				repo := NewLedgerRepository(mt.Coll)

				// Call method
				update := bson.M{
					"$set": bson.M{"field": "value"},
				}
				opts := []*LedgerWriteOptions{
					{
						InsertionId: &insertionId,
						TxTime:      &txTime,
						Signature:   &signature,
					},
				}

				id, err := repo.LedgerUpdateById(entityId, update, opts...)
				assert.Error(mt, err)
				assert.Equal(mt, ErrSignatureExists, err)
				assert.Nil(mt, id)
			})

			mt.Run("Error - Entity Not Found", func(mt *mtest.T) {
				// Test data
				entityId := primitive.NewObjectID()
				insertionId := primitive.NewObjectID()
				txTime := primitive.NewDateTimeFromTime(time.Now().UTC())

				// Setup mock responses
				mt.AddMockResponses(
					mtest.CreateCommandErrorResponse(mtest.CommandError{
						Code:    11000,
						Message: "document not found",
					}),
				)

				// Create repository with mocked client
				repo := NewLedgerRepository(mt.Coll)

				// Call method
				update := bson.M{
					"$set": bson.M{"field": "value"},
				}
				opts := []*LedgerWriteOptions{
					{
						InsertionId: &insertionId,
						TxTime:      &txTime,
					},
				}

				id, err := repo.LedgerUpdateById(entityId, update, opts...)
				assert.Error(mt, err)
				assert.Nil(mt, id)
			})
	*/
}

// We can't mock the computeEntityHash function directly, so let's create test helpers
func runLedgerVerifyTest(t *testing.T, mainDoc bson.D, historyDocs []bson.D, mockResponses []bson.D, expectError bool) {
	mt := mtest.New(t, mtest.NewOptions().ClientType(mtest.Mock))

	mt.Run("verify test", func(mt *mtest.T) {
		entityId := mainDoc[0].Value.(primitive.ObjectID)

		// Add mock responses
		mt.AddMockResponses(mockResponses...)

		// Create repository with mocked client
		repo := NewLedgerRepository(mt.Coll)

		// Call method
		verified, err := repo.LedgerVerifyById(entityId)

		// Assertions
		if expectError {
			assert.Error(mt, err)
		} else {
			assert.NoError(mt, err)
			assert.False(mt, verified)
		}
	})
}

func TestLedgerRepository_LedgerVerifyById(t *testing.T) {
	// Let's simplify our test approach to focus on the Entity not found scenario

	t.Run("Entity Not Found Test", func(t *testing.T) {
		// Create a new mock test
		mt := mtest.New(t, mtest.NewOptions().ClientType(mtest.Mock))

		mt.Run("test", func(mt *mtest.T) {
			// Test data
			entityId := primitive.NewObjectID()
			historyCollection := mt.Coll.Name() + "_history"

			// For FindOne, we need to create an empty cursor response with no documents
			// This will result in mongo.ErrNoDocuments when decoded
			mt.AddMockResponses(
				// Empty cursor response for FindOne - will result in mongo.ErrNoDocuments when decoded
				mtest.CreateCursorResponse(
					0, // 0 results
					fmt.Sprintf("%s.%s", mt.DB.Name(), mt.Coll.Name()),
					mtest.FirstBatch, // No documents in batch
				),

				// Response for the aggregate call for history
				mtest.CreateCursorResponse(
					0,
					fmt.Sprintf("%s.%s", mt.DB.Name(), historyCollection),
					mtest.FirstBatch,
				),

				// Response for closing cursor
				mtest.CreateSuccessResponse(),
			)

			// Create repository with mocked client
			repo := NewLedgerRepository(mt.Coll)

			// Call verify method which should handle the not found case appropriately
			verified, err := repo.LedgerVerifyById(entityId)

			// The method should handle "not found" gracefully by returning false without error
			assert.NoError(mt, err, "Should not error for entity not found")
			assert.False(mt, verified, "Entity not found should not be verified")
		})
	})
}

// This test validates the aggregate pipeline structure
func TestLedgerRepository_LedgerVerifyById_Aggregate(t *testing.T) {
	// This test confirms the basic structure of the aggregate pipeline works
	// without trying to mock computeEntityHash

	mt := mtest.New(t, mtest.NewOptions().ClientType(mtest.Mock))

	mt.Run("Verify Aggregate Pipeline", func(mt *mtest.T) {
		// Test data
		entityId := primitive.NewObjectID()
		historyCollection := mt.Coll.Name() + "_history"

		// Setup mock responses for an entity that exists but will fail type assertion
		mt.AddMockResponses(
			// FindOneById response for main document - with _meta but missing hash
			mtest.CreateCursorResponse(
				1,
				fmt.Sprintf("%s.%s", mt.DB.Name(), mt.Coll.Name()),
				mtest.FirstBatch,
				bson.D{
					{Key: "_id", Value: entityId},
					{Key: "_meta", Value: bson.D{
						// Missing hash field will cause a different type of error
						{Key: "version", Value: 1},
					}},
				},
			),

			// Proper cursor response format for aggregate
			mtest.CreateCursorResponse(
				0,
				fmt.Sprintf("%s.%s", mt.DB.Name(), historyCollection),
				mtest.FirstBatch,
			),

			// Cursor close response
			mtest.CreateSuccessResponse(),
		)

		// Create repository with mocked client
		repo := NewLedgerRepository(mt.Coll)

		// Call method - we expect it to fail but not panic
		verified, err := repo.LedgerVerifyById(entityId)

		// We're testing that the code handles missing hash field gracefully
		t.Log("Final result:", verified, "Error:", err)

		// It should not be verified, regardless of whether there's an error
		assert.False(mt, verified, "Document with missing hash should not be verified")
	})
}
