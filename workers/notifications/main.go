// Package main — Notification Worker
//
// Consumes notification-events from Flo and dispatches to delivery channels
// (email via Resend). Channels are wired via ContainerRef following the
// ISendNotification interface from the incumbent Stanza architecture.
//
// Stream: notification-events
// Event type: notification.send
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	flo "github.com/floruntime/flo-go"
	evts "github.com/propeller/propeller/libs/go-events"

	"github.com/propeller/propeller/workers/notifications/config"
	app "github.com/propeller/propeller/workers/notifications/src"
	"github.com/propeller/propeller/workers/notifications/src/handlers"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := config.GetConfig()

	// ── Connect to Flo ──
	floClient := flo.NewClient(cfg.FloAddr,
		flo.WithNamespace(cfg.FloNamespace),
		flo.WithTimeout(10*time.Second),
	)
	if err := floClient.Connect(); err != nil {
		slog.Error("failed to connect to Flo", "addr", cfg.FloAddr, "namespace", cfg.FloNamespace, "error", err)
		os.Exit(1)
	}

	defer floClient.Close()
	slog.Info("connected to Flo", "addr", cfg.FloAddr, "namespace", cfg.FloNamespace)

	// ── Wire services ──
	ref := app.NewContainerRef(cfg)

	// ── Stream worker ──
	worker, err := floClient.NewStreamWorker(flo.StreamWorkerOptions{
		Stream:      evts.StreamNotificationEvents,
		Group:       "notification",
		Concurrency: 5,
		BatchSize:   10,
		// Route the worker's reconnect/group-join logs through slog so they
		// land in the structured JSON pipeline instead of plain stderr.
		Logger: newFloLogger(),
	}, handlers.MakeHandler(ref))
	if err != nil {
		slog.Error("failed to create stream worker", "error", err)
		os.Exit(1)
	}
	defer worker.Close()

	slog.Info("notification worker started", "stream", evts.StreamNotificationEvents)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	// Stop() calls client.Interrupt() to unblock an in-flight GroupRead immediately.
	// defer worker.Close() alone runs too late (after Start returns).
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
