module github.com/propeller/propeller/workers/notifications

go 1.25.0

require (
	github.com/floruntime/flo-go v0.1.0-dev.16
	github.com/propeller/propeller/libs/go-events v0.0.0
	go.mongodb.org/mongo-driver v1.17.9
)

replace github.com/propeller/propeller/libs/go-events => ../../libs/go-events
