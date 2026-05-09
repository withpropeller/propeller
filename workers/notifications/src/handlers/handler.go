package handlers

import (
	"log/slog"

	flo "github.com/floruntime/flo-go"
	app "github.com/propeller/propeller/workers/notifications/src"
	"github.com/propeller/propeller/workers/notifications/src/models"
)

// ProcessHandler consumes notification-events and dispatches via wired services.
type ProcessHandler struct {
	Ref *app.ContainerRef
}

// MakeHandler returns a flo.StreamRecordHandler that processes notification records.
func MakeHandler(ref *app.ContainerRef) flo.StreamRecordHandler {
	h := &ProcessHandler{Ref: ref}
	return func(sctx *flo.StreamContext) error {
		var env models.NotificationEnvelope
		if err := sctx.Into(&env); err != nil {
			slog.Warn("notification: unmarshal failed, nacking", "streamId", sctx.StreamID(), "error", err)
			return err
		}

		switch env.Type {
		case "notification.send":
			return h.handleSend(env.Payload)
		default:
			slog.Warn("unknown notification type", "type", env.Type)
		}

		return nil
	}
}

func (h *ProcessHandler) handleSend(job models.NotificationJob) error {
	channels := models.ExtractChannels(job.To)

	if len(channels.Email) > 0 {
		if err := h.Ref.EmailService.Send(channels.Email, job); err != nil {
			slog.Error("email send failed", "template", job.Template, "error", err)
		}
	}

	if len(channels.Slack) > 0 || len(channels.Push) > 0 || len(channels.Phone) > 0 {
		slog.Debug("channel not yet implemented", "slack", len(channels.Slack), "push", len(channels.Push), "phone", len(channels.Phone))
	}

	return nil
}
