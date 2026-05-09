// Package main — Compliance Worker
//
// Consumes Flo events from kyb-events and business-events streams via a
// single StreamWorker (consumer group, auto-ack/nack, stream routing).
//
// Event flow:
//
//	kyb.submitted             → screen business + stakeholders (TODO: ComplyAdvantage)
//	kyb.completed             → audit
//	business.submission-ready → dispatch submit-kyb action to core
//	business.activated        → audit
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
	"github.com/propeller/propeller/workers/compliance/handlers"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg := loadConfig()

	// ── Connect to Flo ──
	floClient := flo.NewClient(cfg.FloAddr,
		flo.WithNamespace("propeller"),
		flo.WithTimeout(10*time.Second),
	)
	if err := floClient.Connect(); err != nil {
		slog.Error("failed to connect to Flo", "addr", cfg.FloAddr, "error", err)
		os.Exit(1)
	}
	defer floClient.Close()
	slog.Info("connected to Flo", "addr", cfg.FloAddr)

	// ── Single worker consuming both streams ──
	worker, err := floClient.NewStreamWorker(flo.StreamWorkerOptions{
		Streams:     []string{evts.StreamKybEvents, evts.StreamBusinessEvents},
		Group:       "compliance",
		Concurrency: 10,
		BatchSize:   10,
	}, handlers.MakeHandler(floClient))
	if err != nil {
		slog.Error("failed to create stream worker", "error", err)
		os.Exit(1)
	}
	defer worker.Close()

	slog.Info("compliance worker started",
		"streams", []string{evts.StreamKybEvents, evts.StreamBusinessEvents},
	)

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	if err := worker.Start(ctx); err != nil {
		slog.Error("stream worker exited", "error", err)
	}

	slog.Info("shutdown complete")
}
