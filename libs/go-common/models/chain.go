package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChainAddressMetadata struct {
	AccountId    primitive.ObjectID `bson:"accountId"`
	BridgeWallet string             `bson:"bridgeWallet"`
}

type ChainAddress struct {
	ID              primitive.ObjectID   `bson:"_id,omitempty"`
	Address         string               `bson:"address"`
	Chain           string               `bson:"chain"`
	LastBalance     uint64               `bson:"lastBalance"`
	TokenBalances   map[string]uint64    `bson:"tokenBalances,omitempty"` // currency -> balance (e.g., "USDC" -> 1500000)
	LastChecked     time.Time            `bson:"lastChecked"`
	LastTxSignature string               `bson:"lastTxSignature,omitempty"`
	IsActive        bool                 `bson:"isActive"`
	Metadata        ChainAddressMetadata `bson:"metadata"`
	CreatedAt       time.Time            `bson:"createdAt"`
	UpdatedAt       time.Time            `bson:"updatedAt"`
}

type BalanceHistory struct {
	ID          primitive.ObjectID
	Address     string
	Chain       string
	Currency    string `bson:"currency"`            // "SOL", "USDC", "USDT"
	TokenMint   string `bson:"tokenMint,omitempty"` // Token mint address for SPL tokens
	Balance     uint64
	PrevBalance uint64
	Difference  int64
	TxHash      string
	BlockNumber uint64
	DetectedAt  time.Time
}
