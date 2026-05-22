package models

import (
	"bytes"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// NotificationEnvelope wraps a notification job for delivery.
type NotificationEnvelope struct {
	Type    string          `json:"type"`
	Payload NotificationJob `json:"payload"`
}

// EmailTemplateData is passed to email templates.
type EmailTemplateData struct {
	AppDomain    string
	FirstName    string
	BusinessName string
	VerifyLink   string
	ResetLink    string
	Token        string
	Year         int
	ContentBody  template.HTML
	Content      map[string]interface{}
}

const defaultAppDomain = "https://app.withpropeller.com"

// GetTextFromTemplate renders a body fragment and wraps it in carcass.html when present.
func GetTextFromTemplate(channel string, templateName string, content map[string]interface{}) (*string, error) {
	cwd, _ := os.Getwd()
	bodyPath := filepath.Join(cwd, "templates", channel, templateName+".html")
	body, err := renderTemplateFile(bodyPath, content)
	if err != nil {
		return nil, err
	}

	carcassPath := filepath.Join(cwd, "templates", channel, "carcass.html")
	if _, statErr := os.Stat(carcassPath); statErr != nil {
		return body, nil
	}

	wrapContent := make(map[string]interface{}, len(content)+1)
	for k, v := range content {
		wrapContent[k] = v
	}
	wrapContent["contentBody"] = template.HTML(*body)

	return renderTemplateFile(carcassPath, wrapContent)
}

func renderTemplateFile(fileName string, content map[string]interface{}) (*string, error) {
	tmpl, err := template.ParseFiles(fileName)
	if err != nil {
		return nil, err
	}

	data := buildTemplateData(content)

	buf := new(bytes.Buffer)
	if err := tmpl.Execute(buf, data); err != nil {
		return nil, err
	}

	text := buf.String()
	return &text, nil
}

func buildTemplateData(content map[string]interface{}) EmailTemplateData {
	data := EmailTemplateData{
		Year:    time.Now().Year(),
		Content: content,
	}
	if v, ok := content["firstName"].(string); ok {
		data.FirstName = v
	}
	if v, ok := content["businessName"].(string); ok {
		data.BusinessName = v
	}
	if v, ok := content["app_domain"].(string); ok && v != "" {
		data.AppDomain = strings.TrimRight(v, "/")
	} else if v, ok := content["site_domain"].(string); ok && v != "" {
		data.AppDomain = strings.TrimRight(v, "/")
	}
	if data.AppDomain == "" {
		data.AppDomain = defaultAppDomain
	}
	if v, ok := content["verifyLink"].(string); ok {
		data.VerifyLink = v
	}
	if v, ok := content["resetLink"].(string); ok {
		data.ResetLink = v
	}
	if v, ok := content["securityToken"].(string); ok {
		data.Token = v
	}
	if v, ok := content["contentBody"].(template.HTML); ok {
		data.ContentBody = v
	}
	return data
}

// BuildFallbackBody produces a simple HTML body when no template is on disk.
func BuildFallbackBody(templateName string, content map[string]interface{}) string {
	firstName, _ := content["firstName"].(string)
	if firstName == "" {
		firstName = "there"
	}

	var b strings.Builder
	b.WriteString(fmt.Sprintf("<p>Hi %s,</p>", firstName))

	switch templateName {
	case "confirm.account":
		b.WriteString("<p>Please confirm your email address to activate your Propeller account.</p>")
	case "reset.password":
		b.WriteString("<p>A password reset was requested for your Propeller account.</p>")
	case "account.activated":
		b.WriteString("<p>Your business has been activated on Propeller. You can now accept payments and request payouts.</p>")
	case "owner.welcome":
		b.WriteString("<p>Welcome to Propeller — accept payments from African customers in local currency, through local rails.</p>")
	case "two-factor.requested":
		b.WriteString("<p>Here is your verification code. It will expire shortly.</p>")
	case "user.kyc.prompt":
		b.WriteString("<p>Please complete your business verification to activate your Propeller account.</p>")
	case "login.alert":
		b.WriteString("<p>We noticed a new sign-in to your Propeller dashboard.</p>")
	case "business.kyb.submitted":
		b.WriteString("<p>Your business verification has been submitted for review.</p>")
	case "business.kyb.approved":
		b.WriteString("<p>Your business verification has been approved. Your account is now active.</p>")
	case "payment.confirmed":
		b.WriteString("<p>A payment has been confirmed and posted to your balance.</p>")
	case "payout.completed":
		b.WriteString("<p>Your payout has been completed. USDC has been delivered.</p>")
	default:
		b.WriteString("<p>You have a new notification from Propeller.</p>")
	}

	b.WriteString("<p>— The Propeller Team</p>")
	return b.String()
}
