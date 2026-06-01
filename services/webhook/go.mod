module github.com/propeller/propeller/services/webhook

go 1.23.0

require (
	github.com/floruntime/flo-go v0.1.0-dev.19
	github.com/go-chi/chi/v5 v5.2.5
	github.com/propeller/propeller/libs/common v0.0.0-00010101000000-000000000000
	github.com/propeller/propeller/libs/go-events v0.0.0-00010101000000-000000000000
)

replace (
	github.com/propeller/propeller/libs/common => ../../libs/common
	github.com/propeller/propeller/libs/go-events => ../../libs/go-events
)
