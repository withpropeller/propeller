// Probe for the cross-shard blocking-read connection-drop issue.
//
// Mirrors the shape of the Propeller `notifications` worker
// (workers/notifications/main.go) — uses StreamWorker against a stream
// that quickly becomes empty. The interesting signal is whether the
// worker stays connected across multiple BlockMS cycles, or whether you
// see repeating "Connection lost, reconnecting..." log lines from the
// SDK.
//
// Pair with the server-side debug logs added to shard.zig:
//
//	"group_read register: ..."
//	"waiter timeout: ..."
//	"deliverDeferred[cross]: sent ..."  or  "[same]: write ..."
//	"deliverInbound: write ..."
//
// If you see register + timeout + sent but no inbound write on the owner
// shard, the inbox path is broken. If you see inbound write but the
// client still drops, the socket-write side is the suspect.
//
// Run:
//
//	FLO_ENDPOINT=localhost:9000 go run main.go
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	flo "github.com/floruntime/flo-go"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	addr := envOr("FLO_ADDR", "localhost:9000")
	namespace := envOr("FLO_NAMESPACE", "prod")
	stream := envOr("FLO_STREAM", "notification-events")
	group := envOr("FLO_GROUP", "notification")

	client := flo.NewClient(addr,
		flo.WithNamespace(namespace),
		flo.WithTimeout(10*time.Second),
	)
	if err := client.Connect(); err != nil {
		slog.Error("failed to connect to Flo", "addr", addr, "namespace", namespace, "error", err)
		os.Exit(1)
	}
	defer client.Close()
	slog.Info("#trial 1: connected to Flo (SDK v0.1.0-dev.18)", "addr", addr, "namespace", namespace)

	// Seed the stream so the consumer group has something to bind to.
	// We don't need more — the probe is about blocking reads against the
	// (then) empty stream after the seed is consumed.
	if _, err := client.Stream.Append(stream, []byte(`{"probe":"seed"}`), nil); err != nil {
		slog.Error("seed append failed", "error", err)
		os.Exit(1)
	}

	worker, err := client.NewStreamWorker(flo.StreamWorkerOptions{
		Stream:      stream,
		Group:       group,
		Concurrency: 5,
		BatchSize:   10,
		Logger:      slogPrintf{},
	}, handle)
	if err != nil {
		slog.Error("failed to create stream worker", "error", err)
		os.Exit(1)
	}
	defer worker.Close()

	slog.Info("probe worker started", "stream", stream, "group", group)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	go func() {
		<-ctx.Done()
		slog.Info("shutdown signal received, stopping worker")
		worker.Stop()
	}()

	if err := worker.Start(ctx); err != nil && ctx.Err() == nil {
		slog.Error("stream worker exited", "error", err)
	}
	slog.Info("shutdown complete")
}

func handle(sctx *flo.StreamContext) error {
	slog.Info("received record", "stream_id", sctx.StreamID())
	return nil // auto-ack
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// slogPrintf adapts slog into the SDK's Printf-based Logger interface.
type slogPrintf struct{}

func (slogPrintf) Printf(format string, v ...any) {
	slog.Info("flo-sdk", "msg", fmt.Sprintf(format, v...))
}
