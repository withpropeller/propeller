package integrations

import "github.com/propeller/propeller/workers/notifications/src/models"

// ISendNotification is the channel delivery interface.
// Each implementation (email, push, slack, phone) satisfies this.
type ISendNotification interface {
	Send(entities []models.NotificationEntity, job models.NotificationJob) error
}
