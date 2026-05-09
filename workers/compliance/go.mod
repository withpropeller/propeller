module github.com/propeller/propeller/workers/compliance

go 1.25.0

require (
	github.com/floruntime/flo-go v0.1.0-dev.15
	github.com/propeller/propeller/libs/go-events v0.0.0
	github.com/propeller/propeller/services/core v0.0.0
)

replace (
	github.com/propeller/propeller/libs/go-events => ../../libs/go-events
	github.com/propeller/propeller/services/core => ../../services/core
)
