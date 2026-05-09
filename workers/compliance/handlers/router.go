package handlers

import (
	"log/slog"

	flo "github.com/floruntime/flo-go"

	evts "github.com/propeller/propeller/libs/go-events"
)

// EventEnvelope is the common shape of all stream records.
type EventEnvelope struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

// MakeHandler returns a StreamRecordHandler that routes records by stream name.
func MakeHandler(client *flo.Client) flo.StreamRecordHandler {
	return func(sctx *flo.StreamContext) error {
		switch sctx.Stream() {
		case evts.StreamKybEvents:
			return handleKybRecord(sctx, client)
		case evts.StreamBusinessEvents:
			return handleBusinessRecord(sctx, client)
		default:
			slog.Warn("received record from unknown stream", "stream", sctx.Stream())
			return nil // ack to avoid poison-pill loop
		}
	}
}
