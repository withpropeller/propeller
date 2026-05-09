package models

type AuditSource struct {
	IpAddress string `json:"ipAddress"`
	Client    string `json:"client"`
	Channel   string `json:"channel"`
}
