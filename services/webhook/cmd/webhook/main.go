// Package main — Propeller Webhook Receiver
//
// Stateless Go service. Receives webhooks from external providers,
// verifies signatures, deduplicates via flo KV, publishes to the
// raw-webhooks flo stream, and returns 200.
//
// Flo processing pipeline (infra/flo-pipelines/webhook-router.yaml)
// then routes events to dedicated streams (payment-events, kyb-events, etc.)
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	flo "github.com/floruntime/flo-go"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/propeller/propeller/services/webhook/internal/config"
	"github.com/propeller/propeller/services/webhook/internal/verify"
	evts "github.com/propeller/propeller/libs/go-events"
	"github.com/propeller/propeller/libs/common"
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
		flo.WithTimeout(5*time.Second),
	)
	if err := floClient.Connect(); err != nil {
		slog.Error("failed to connect to Flo", "addr", cfg.FloAddr, "error", err)
		os.Exit(1)
	}
	defer floClient.Close()
	slog.Info("connected to Flo", "addr", cfg.FloAddr)

	// ── Verifier registry ──
	verifiers := make(map[string]verify.Verifier)
	if cfg.PaystackEnabled {
		verifiers["paystack"] = verify.NewPaystackVerifier(cfg.PaystackSecret, cfg.PaystackWebhookSecret)
	}
	if cfg.PayKKaEnabled {
		verifiers["paykka"] = verify.NewPayKKaVerifier(cfg.PayKKaPublicKey)
	}
	if cfg.DojahEnabled {
		verifiers["dojah"] = verify.NewDojahVerifier(cfg.DojahWebhookSecret)
	}
	if cfg.GlobalstackEnabled {
		verifiers["globalstack"] = verify.NewGlobalstackVerifier(cfg.GlobalstackWebhookSecret)
	}

	// ── Router ──
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Timeout(10 * time.Second))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		status := "ok"
		floStatus := "connected"
		if !floClient.IsConnected() {
			status = "degraded"
			floStatus = "disconnected"
		}
		json.NewEncoder(w).Encode(map[string]string{
			"status": status, "service": "webhook", "flo": floStatus,
		})
	})

	// ── Webhook endpoints ──
	r.Post("/webhooks/{provider}", func(w http.ResponseWriter, r *http.Request) {
		provider := chi.URLParam(r, "provider")

		v, ok := verifiers[provider]
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error": "unsupported provider: " + provider,
			})
			return
		}

		// Read raw body
		body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20)) // 1 MiB max
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "failed to read body"})
			return
		}

		// Verify signature
		if err := v.Verify(body, r.Header); err != nil {
			slog.Warn("webhook verification failed", "provider", provider, "error", err)
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid signature"})
			return
		}

		// Build idempotency key from provider + signature or event ID
		idemKey := common.HashString(provider + ":" + string(body))

		// Dedup via flo KV
		dedupKV := "webhook:" + provider + ":" + idemKey
		exists, err := floClient.KV.Get(context.Background(), dedupKV)
		if err == nil && exists != "" {
			// Already processed
			writeJSON(w, http.StatusOK, map[string]string{"status": "duplicate"})
			return
		}

		// Mark as processed (24h TTL)
		if err := floClient.KV.Set(context.Background(), dedupKV, "1", 24*time.Hour); err != nil {
			slog.Error("failed to set dedup key", "error", err)
		}

		// Build webhook record
		record := evts.WebhookRecord{
			Source:         provider,
			Event:          r.Header.Get("X-Event-Type"),
			Payload:        parseJSON(body),
			Headers:        flattenHeaders(r.Header),
			ReceivedAt:     time.Now().UTC().Format(time.RFC3339),
			IdempotencyKey: idemKey,
		}

		// Publish to raw-webhooks stream
		recordBytes, _ := json.Marshal(record)
		if err := floClient.Streams.Publish(context.Background(), evts.StreamRawWebhooks, recordBytes); err != nil {
			slog.Error("failed to publish webhook", "provider", provider, "error", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to publish"})
			return
		}

		slog.Info("webhook processed", "provider", provider, "event", record.Event)
		writeJSON(w, http.StatusOK, map[string]string{"status": "received"})
	})

	// ── Serve ──
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("webhook service starting", "port", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func parseJSON(data []byte) map[string]interface{} {
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return map[string]interface{}{"raw": string(data)}
	}
	return result
}

func flattenHeaders(h http.Header) map[string]string {
	result := make(map[string]string, len(h))
	for k, v := range h {
		if len(v) > 0 {
			result[k] = v[0]
		}
	}
	return result
}
