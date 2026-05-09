package models

import "time"

type BridgeWallet struct {
	ID        string    `json:"id"`
	Chain     string    `json:"chain,omitempty"`
	Address   string    `json:"address,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}
