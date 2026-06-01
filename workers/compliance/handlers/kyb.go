package handlers

import (
	"encoding/json"
	"log/slog"

	flo "github.com/floruntime/flo-go"

	evts "github.com/propeller/propeller/libs/go-events"
)

// handleKybRecord processes records on the kyb-events stream, which carries two shapes:
//
//   - internal EventEnvelope {type, payload} published by core
//     (kyb.submitted, kyb.rejected, kyb.manual_review, …)
//   - raw WebhookRecord {source, event, payload, …} forwarded by the webhook-router
//     for inbound PayKKa assessment/notify callbacks (source=paykka)
//
// We disambiguate on the presence of a "source" field.
func handleKybRecord(sctx *flo.StreamContext, client *flo.Client) error {
	var probe struct {
		Type   string `json:"type"`
		Source string `json:"source"`
	}
	if err := sctx.Into(&probe); err != nil {
		slog.Warn("kyb: unmarshal failed, nacking", "streamId", sctx.StreamID(), "error", err)
		return err
	}

	if probe.Source == "paykka" {
		return handlePaykkaAssessmentNotify(sctx, client)
	}

	var env EventEnvelope
	if err := sctx.Into(&env); err != nil {
		slog.Warn("kyb: envelope unmarshal failed, nacking", "streamId", sctx.StreamID(), "error", err)
		return err
	}

	switch env.Type {
	case evts.EventKybSubmitted:
		return handleKybSubmitted(env)
	case evts.EventKybRejected:
		slog.Info("kyb rejected event received", "payload", env.Payload)
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
	slog.Info("kyb.submitted — assessment in flight", "businessId", businessID, "merchId", merchID)
	return nil
}

// handlePaykkaAssessmentNotify processes an inbound /api/v2/merch/assessment/notify
// callback, applies our risk policy, and dispatches complete-kyb to core (which
// owns Mongo and resolves merch_id → business).
//
// Risk policy (confirmed):
//   - PASS + LOW/MIDDLE → APPROVED   (auto-activate)
//   - PASS + HIGH        → MANUAL_REVIEW
//   - REFUSED/REJECTED/AUTH_FAIL → REJECTED
//   - INIT/WAIT → interim, nothing to dispatch yet
func handlePaykkaAssessmentNotify(sctx *flo.StreamContext, client *flo.Client) error {
	var rec struct {
		Source  string `json:"source"`
		Payload struct {
			Type    string `json:"type"`
			Version string `json:"version"`
			Data    struct {
				RequestID string `json:"request_id"`
				MerchID   string `json:"merch_id"`
				Status    string `json:"status"`
				Msg       string `json:"msg"`
				RiskLevel string `json:"risk_level"`
			} `json:"data"`
		} `json:"payload"`
	}
	if err := sctx.Into(&rec); err != nil {
		slog.Warn("paykka notify: unmarshal failed, nacking", "streamId", sctx.StreamID(), "error", err)
		return err
	}

	d := rec.Payload.Data
	decision, terminal := decideKyb(d.Status, d.RiskLevel)

	slog.Info("paykka assessment notify",
		"merchId", d.MerchID, "requestId", d.RequestID,
		"status", d.Status, "riskLevel", d.RiskLevel, "decision", decision,
	)

	if !terminal {
		// INIT/WAIT or unknown — no terminal decision yet, ack and wait for the next notify.
		return nil
	}

	input, _ := json.Marshal(map[string]string{
		"merchId":      d.MerchID,
		"requestId":    d.RequestID,
		"status":       decision, // APPROVED | REJECTED | MANUAL_REVIEW
		"paykkaStatus": d.Status, // raw PASS | REFUSED | ... for audit
		"riskLevel":    d.RiskLevel,
		"message":      d.Msg,
	})

	result, err := client.Action.Invoke(evts.ActionCompleteKyb, input, nil)
	if err != nil {
		slog.Error("invoke complete-kyb failed", "merchId", d.MerchID, "error", err)
		return err
	}
	slog.Info("complete-kyb action dispatched", "merchId", d.MerchID, "decision", decision, "runId", result.RunID)
	return nil
}

// decideKyb maps a PayKKa assessment (status + risk_level) to our terminal KYB
// decision. terminal is false for interim states that warrant no action yet.
func decideKyb(status, riskLevel string) (decision string, terminal bool) {
	switch status {
	case "PASS":
		if riskLevel == "HIGH" {
			return "MANUAL_REVIEW", true
		}
		return "APPROVED", true
	case "REFUSED", "REJECTED", "AUTH_FAIL":
		return "REJECTED", true
	default: // INIT, WAIT, unknown
		return "", false
	}
}
