// Package main — Propeller Core Service
//
// The workhorse of Propeller. Registers flo action handlers and
// stream workers. Action handlers call into libs/ledger (TigerBeetle)
// and libs/providers (external integrations).
//
// No business logic in main() — all handlers are in internal/handlers/.
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	flo "github.com/floruntime/flo-go"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	evts "github.com/propeller/propeller/libs/go-events"
	"github.com/propeller/propeller/services/core/internal/config"
	"github.com/propeller/propeller/services/core/internal/handlers"
	"github.com/propeller/propeller/services/core/internal/ledger"
	"github.com/propeller/propeller/services/core/internal/paykka"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config error", "error", err)
		os.Exit(1)
	}

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

	// ── Connect to MongoDB ──
	mongoCtx, mongoCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer mongoCancel()
	mongoClient, err := mongo.Connect(mongoCtx, options.Client().ApplyURI(cfg.MongoURI))
	if err != nil {
		slog.Error("failed to connect to mongo", "error", err)
		os.Exit(1)
	}
	defer func() { _ = mongoClient.Disconnect(context.Background()) }()
	mdb := mongoClient.Database(cfg.MongoDB)
	slog.Info("connected to MongoDB", "db", cfg.MongoDB)

	// ── Init ledger (TigerBeetle + Mongo audit + outbox) ──
	led, err := ledger.New(cfg.TBAddresses, cfg.TBClusterID, mdb)
	if err != nil {
		slog.Error("failed to init ledger", "error", err)
		os.Exit(1)
	}
	defer led.Close()
	if err := led.EnsureIndexes(context.Background()); err != nil {
		slog.Error("failed to ensure ledger indexes", "error", err)
		os.Exit(1)
	}
	if err := led.EnsureSystemAccounts(context.Background(), "NGN"); err != nil {
		slog.Error("failed to bootstrap system accounts", "error", err)
		os.Exit(1)
	}

	// ── Outbox reaper: retries any TB/Mongo writes that crashed mid-flight ──
	reaperCtx, stopReaper := context.WithCancel(context.Background())
	defer stopReaper()
	go runReaper(reaperCtx, led)

	// ── Init PayKKa client (if enabled) ──
	var paykkaClient *paykka.Client
	if cfg.PayKKaEnabled {
		var err error
		paykkaClient, err = paykka.NewClient(
			cfg.PayKKaBaseURL,
			cfg.PayKKaPrivateKeyPEM,
			cfg.PayKKaPublicKeyPEM,
			cfg.PayKKaKeyID,
			cfg.PayKKaMerchID,
		)
		if err != nil {
			slog.Error("failed to init PayKKa client", "error", err)
			os.Exit(1)
		}
		slog.Info("PayKKa client initialized")
	}

	// ── Register action handlers ──
	deps := &handlers.Deps{
		Cfg:    cfg,
		Flo:    floClient,
		Ledger: led,
		PayKKa: paykkaClient,
		Mongo:  mdb,
	}

	actionHandlers := map[string]flo.ActionHandler{
		evts.ActionReceivePayment:   handlers.ReceivePayment(deps),
		evts.ActionRejectPayment:    handlers.RejectPayment(deps),
		evts.ActionSubmitKyb:        handlers.SubmitKyb(deps),
		evts.ActionCompleteKyb:      handlers.CompleteKyb(deps),
		evts.ActionCompleteKyc:      handlers.CompleteKyc(deps),
		evts.ActionRoutePayout:      handlers.RoutePayout(deps),
		evts.ActionDeliverPayout:    handlers.DeliverPayout(deps),
		evts.ActionSettlePayout:     handlers.SettlePayout(deps),
		evts.ActionFailPayout:       handlers.FailPayout(deps),
		evts.ActionActivateBusiness: handlers.ActivateBusiness(deps),
		evts.ActionDebitLedger:      handlers.DebitLedger(deps),
		evts.ActionCreditLedger:     handlers.CreditLedger(deps),
	}

	aw, err := floClient.NewActionWorker(flo.ActionWorkerOptions{Concurrency: 20})
	if err != nil {
		slog.Error("failed to create action worker", "error", err)
		os.Exit(1)
	}
	for name, handler := range actionHandlers {
		aw.MustRegisterAction(name, handler)
	}

	// ── Stream workers (webhook → action dispatch) ──
	// These listen on dedicated streams and trigger action chains
	_ = []struct {
		Stream string
		Group  string
	}{
		{evts.StreamPaymentEvents, "core-payments"},
		{evts.StreamKybEvents, "core-kyb"},
		{evts.StreamKycEvents, "core-kyc"},
		{evts.StreamPayoutEvents, "core-payouts"},
	}

	// ── Sync workflows ──
	// if _, err := floClient.Workflow.SyncDir("./workflows", nil); err != nil {
	// 	slog.Error("workflow sync failed", "error", err)
	// 	os.Exit(1)
	// }

	// ── Sync processing pipelines ──
	// if _, err := floClient.Processing.SyncDir("./pipelines", nil); err != nil {
	// 	slog.Error("pipeline sync failed", "error", err)
	// 	os.Exit(1)
	// }

	slog.Info("core service started",
		"actions_registered", len(actionHandlers),
	)

	// ── Wait for signal ──
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down")
	aw.Stop()
	slog.Info("shutdown complete")
}

// runReaper periodically retries outbox entries that crashed mid-write.
// All steps are idempotent (TB rejects duplicates; Mongo dedupes by signature).
//
// A panic inside Reap (e.g. a Mongo driver crash) would otherwise kill the
// goroutine silently and stuck entries would accumulate forever — recover
// and log so the loop keeps ticking.
func runReaper(ctx context.Context, led *ledger.Ledger) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("outbox reaper panic; restarting", "panic", r)
			// Restart the loop after a panic so a single bad entry never
			// silently disables crash recovery for the whole service.
			go runReaper(ctx, led)
		}
	}()
	tick := time.NewTicker(15 * time.Second)
	defer tick.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-tick.C:
			n, err := led.Reap(ctx, 30*time.Second, 100)
			if err != nil {
				slog.Warn("outbox reaper error", "error", err)
				continue
			}
			if n > 0 {
				slog.Info("outbox reaped", "healed", n)
			}
		}
	}
}
