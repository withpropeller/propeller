package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"

	flo "github.com/floruntime/flo-go"

	evts "github.com/propeller/propeller/libs/go-events"
)

func handleBusinessRecord(sctx *flo.StreamContext, client *flo.Client) error {
	var env EventEnvelope
	if err := sctx.Into(&env); err != nil {
		slog.Warn("business: unmarshal failed, nacking", "streamId", sctx.StreamID(), "error", err)
		return err
	}

	switch env.Type {
	case evts.EventBusinessKycSubmitted:
		return handleBusinessKycSubmitted(env, client)
	case evts.EventBusinessActivated:
		slog.Info("business activated event received", "payload", env.Payload)
		// TODO: persist audit trail
	default:
		slog.Warn("unknown business event type", "type", env.Type)
	}

	return nil
}

func handleBusinessKycSubmitted(env EventEnvelope, client *flo.Client) error {
	businessID, _ := env.Payload["businessId"].(string)
	if businessID == "" {
		return fmt.Errorf("business.kyc-submitted: missing businessId")
	}

	requestID := generateRequestID()
	input, _ := json.Marshal(map[string]string{
		"businessId": businessID,
		"requestId":  requestID,
	})

	slog.Info("dispatching submit-kyb action", "businessId", businessID, "requestId", requestID)
	result, err := client.Action.Invoke(evts.ActionSubmitKyb, input, nil)
	if err != nil {
		slog.Error("invoke submit-kyb failed", "error", err)
		return fmt.Errorf("invoke submit-kyb: %w", err)
	}
	slog.Info("submit-kyb action dispatched", "businessId", businessID, "runId", result.RunID)
	return nil
}

// generateRequestID returns a hex-encoded 16-byte random ID.
func generateRequestID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
