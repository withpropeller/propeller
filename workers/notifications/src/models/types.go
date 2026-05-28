package models

// NotificationEntity represents a notification destination.
type NotificationEntity struct {
	Id   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

// NotificationTo defines all possible notification channels for a recipient.
type NotificationTo struct {
	Email NotificationEntity `json:"email,omitempty"`
	Phone NotificationEntity `json:"phone,omitempty"`
	Push  NotificationEntity `json:"push,omitempty"`
	Slack NotificationEntity `json:"slack,omitempty"`
}

// NotificationJob represents a notification task.
type NotificationJob struct {
	ID       string                 `json:"id,omitempty"`
	From     NotificationEntity     `json:"from,omitempty"`
	To       []NotificationTo       `json:"to,omitempty"`
	Subject  string                 `json:"subject,omitempty"`
	Template string                 `json:"template,omitempty"`
	Content  map[string]interface{} `json:"content,omitempty"`
}

// NotificationChannels holds extracted channel entities ready for delivery.
type NotificationChannels struct {
	Email []NotificationEntity
	Phone []NotificationEntity
	Push  []NotificationEntity
	Slack []NotificationEntity
}

// NotificationSenders provides default sender identities.
var NotificationSenders = struct {
	NoReply NotificationEntity
	Support NotificationEntity
}{
	NoReply: NotificationEntity{
		Id:   "onboarding@hyphenmoney.com",
		Name: "Propeller",
	},
	Support: NotificationEntity{
		Id:   "support@hyphenmoney.com",
		Name: "Propeller Support",
	},
}

// ExtractChannels separates NotificationTo into per-channel entity slices.
func ExtractChannels(to []NotificationTo) NotificationChannels {
	var channels NotificationChannels
	for _, t := range to {
		if t.Email.Id != "" {
			channels.Email = append(channels.Email, t.Email)
		}
		if t.Phone.Id != "" {
			channels.Phone = append(channels.Phone, t.Phone)
		}
		if t.Push.Id != "" {
			channels.Push = append(channels.Push, t.Push)
		}
		if t.Slack.Id != "" {
			channels.Slack = append(channels.Slack, t.Slack)
		}
	}
	return channels
}
