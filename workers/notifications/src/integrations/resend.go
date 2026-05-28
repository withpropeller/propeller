package integrations

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/propeller/propeller/workers/notifications/config"
	"github.com/propeller/propeller/workers/notifications/src/models"
)

// ResendService sends email via the Resend API.
type ResendService struct {
	apiKey string
	from   string
}

func NewResendService(c *config.ConfigType) *ResendService {
	return &ResendService{
		apiKey: c.ResendAPIKey,
		from:   c.FromEmail,
	}
}

type resendEmail struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	HTML    string   `json:"html,omitempty"`
}

func (s *ResendService) Send(entities []models.NotificationEntity, job models.NotificationJob) error {
	html, err := parseEmailHTML(job)
	if err != nil {
		return fmt.Errorf("render template: %w", err)
	}

	toAddresses := make([]string, 0, len(entities))
	for _, e := range entities {
		if e.Id != "" {
			toAddresses = append(toAddresses, e.Id)
		}
	}

	body := resendEmail{
		From:    s.from,
		To:      toAddresses,
		Subject: getEmailSubject(job),
		HTML:    *html,
	}

	b, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(b))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	slog.Debug("sending email via resend",
		"template", job.Template,
		"from", s.from,
		"recipients", len(toAddresses),
		"subject", body.Subject,
		"htmlBytes", len(body.HTML),
		"hasApiKey", s.apiKey != "",
	)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("send: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read resend response: %w", err)
	}

	if resp.StatusCode >= 300 {
		requestID := resp.Header.Get("x-request-id")
		if requestID == "" {
			requestID = resp.Header.Get("x-resend-request-id")
		}
		bodySnippet := strings.TrimSpace(string(respBody))
		if len(bodySnippet) > 512 {
			bodySnippet = bodySnippet[:512] + "..."
		}
		slog.Error("resend rejected email",
			"status", resp.StatusCode,
			"requestId", requestID,
			"template", job.Template,
			"from", s.from,
			"recipients", len(toAddresses),
			"responseBody", bodySnippet,
		)
		return fmt.Errorf("resend returned %d request_id=%s body=%s", resp.StatusCode, requestID, bodySnippet)
	}

	requestID := resp.Header.Get("x-request-id")
	if requestID == "" {
		requestID = resp.Header.Get("x-resend-request-id")
	}
	slog.Info("email sent", "to", toAddresses, "template", job.Template, "requestId", requestID)
	return nil
}

func getEmailSubject(job models.NotificationJob) string {
	if s, ok := job.Content["subject"].(string); ok && s != "" {
		return s
	}
	return "Propeller"
}

// parseEmailHTML renders the email template to HTML.
// Falls back to a simple text builder if template file not found.
func parseEmailHTML(job models.NotificationJob) (*string, error) {
	text, err := models.GetTextFromTemplate("email", job.Template, job.Content)
	if err != nil {
		fallback := models.BuildFallbackBody(job.Template, job.Content)
		return &fallback, nil
	}
	return text, nil
}
