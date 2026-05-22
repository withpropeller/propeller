// flologger.go — bridges the Flo SDK's logger onto slog.
//
// flo.Logger is a minimal Printf-style interface with no severity level, so
// the stream worker's operational output (reconnects, group joins, handler
// failures) would otherwise bypass this service's structured JSON logging.
// floLogger formats each line and re-emits it through slog under a stable
// "component" attribute, applying a light keyword heuristic to pick a level
// so connection trouble surfaces as a warning rather than hiding at info.
package main

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
)

// floLogger adapts flo.Logger onto an *slog.Logger.
type floLogger struct {
	logger *slog.Logger
}

// newFloLogger returns a flo.Logger that writes through slog's default handler,
// tagged with component=flo-stream-worker.
func newFloLogger() *floLogger {
	return &floLogger{logger: slog.Default().With("component", "flo-stream-worker")}
}

// Printf satisfies flo.Logger. The level is inferred from the message text
// because the SDK interface carries no level of its own.
func (l *floLogger) Printf(format string, v ...interface{}) {
	msg := fmt.Sprintf(format, v...)
	l.logger.Log(context.Background(), levelFor(msg), msg)
}

// levelFor maps a worker log line to an slog level by keyword. Best-effort:
// the SDK's wording could change, so unmatched lines fall back to info.
func levelFor(msg string) slog.Level {
	lower := strings.ToLower(msg)
	switch {
	case strings.Contains(lower, "panic"):
		return slog.LevelError
	case strings.Contains(lower, "fail"),
		strings.Contains(lower, "error"),
		strings.Contains(lower, "lost"),
		strings.Contains(lower, "reconnect"),
		strings.Contains(lower, "warning"),
		strings.Contains(lower, "draining"):
		return slog.LevelWarn
	default:
		return slog.LevelInfo
	}
}
