package handlers

import (
	"log/slog"

	flo "github.com/floruntime/flo-go"

	evts "github.com/propeller/propeller/libs/go-events"
)

func handleKybRecord(sctx *flo.StreamContext, _ *flo.Client) error {
	var env EventEnvelope
	if err := sctx.Into(&env); err != nil {
		slog.Warn("kyb: unmarshal failed, nacking", "streamId", sctx.StreamID(), "error", err)
		return err
	}

	switch env.Type {
	case evts.EventKybSubmitted:
		return handleKybSubmitted(env)
	case evts.EventKybCompleted:
		return handleKybCompleted(env)
	case evts.EventKybManualReview:
		slog.Info("kyb manual review event received", "payload", env.Payload)
	default:
		slog.Warn("unknown kyb event type", "type", env.Type)
	}

	return nil
}

func handleKybSubmitted(env EventEnvelope) error {
	businessID, _ := env.Payload["businessId"].(string)
	merchID, _ := env.Payload["merchId"].(string)
	slog.Info("processing kyb.submitted", "businessId", businessID, "merchId", merchID)
	// TODO: Run ComplyAdvantage screening here once the adapter is wired.
	return nil
}

func handleKybCompleted(env EventEnvelope) error {
	status, _ := env.Payload["status"].(string)
	businessID, _ := env.Payload["businessId"].(string)
	slog.Info("processing kyb.completed", "businessId", businessID, "status", status)
	if status == "APPROVED" {
		slog.Info("kyb approved — awaiting sanctions screening or admin approval", "businessId", businessID)
	}
	return nil
}
