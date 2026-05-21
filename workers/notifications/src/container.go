package src

import (
	"github.com/propeller/propeller/workers/notifications/config"
	"github.com/propeller/propeller/workers/notifications/src/integrations"
)

// ContainerRef wires delivery channel implementations for the worker.
type ContainerRef struct {
	EmailService integrations.ISendNotification
}

// NewContainerRef constructs channel services from runtime config.
func NewContainerRef(cfg *config.ConfigType) *ContainerRef {
	return &ContainerRef{
		EmailService: integrations.NewResendService(cfg),
	}
}
