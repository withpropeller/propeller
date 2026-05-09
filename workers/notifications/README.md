# Notifications Worker

Background worker that processes notification events from Redis Streams and sends emails, SMS, and push notifications.

## Overview

The Notifications Worker consumes events from Redis Streams using the Envoy client library. It handles:

- Email notifications (via AWS SES)
- SMS notifications (via Twilio or similar)
- Push notifications (via FCM/APNS)
- Notification template rendering
- Delivery status tracking

## Architecture

```
Redis Streams (notification events)
    ↓
Notifications Worker (Envoy Consumer)
    ├── Parse Notification Event
    ├── Render Template
    ├── Select Delivery Channel
    ├── Send Notification
    └── Update Delivery Status
```

## Technology Stack

- **Language**: Go 1.23+
- **Event Consumption**: Redis Streams via Envoy (`libs/go-messaging/envoy`)
- **Email**: AWS SES
- **Templates**: Go templates stored in `templates/`
- **Coordination**: Assemble Agent (`libs/go-common/assemble`)

## Key Features

### Event Processing

The worker listens to Redis Streams for notification events:

- `user.registered` - Welcome emails
- `payment.completed` - Payment confirmation notifications
- `transaction.failed` - Error notifications
- Custom notification events from services

### Multi-Channel Support

- **Email**: HTML and plain text emails via AWS SES
- **SMS**: Text messages via SMS provider
- **Push**: Mobile push notifications
- **Slack**: Team notifications (for internal alerts)

### Template System

Notification templates are stored in `templates/`:

- Email templates (HTML)
- SMS templates (text)
- Push notification templates (JSON)

## Development

### Prerequisites

- Go 1.23+
- Redis connection
- AWS SES credentials (for email)
- SMS provider credentials (optional)

### Local Development

```bash
cd workers/notifications

# Set up environment
cp env/dev.env.example env/dev.env
# Edit env/dev.env with your configuration

# Run worker
go run main.go
```

### Environment Variables

```env
APP_ENV=development
LOG_LEVEL=debug
REDIS_URI=redis://localhost:6379
AWS_REGION=eu-west-1
SES_FROM_EMAIL=noreply@usestanza.com
SLACK_TOKEN=your-slack-token
```

## Deployment

The worker is deployed as a Kubernetes Deployment:

- **Type**: Worker (no service, no ingress)
- **Dockerfile**: `infra/docker/Dockerfile.worker`
- **Service Account**: `notifications-worker` (for IRSA with AWS SES)
- **Replicas**: Configurable (default: 1)

Deployment is automated via GitHub Actions. See `.github/deploy-config.yml` for configuration.

## Monitoring

- **Logs**: Structured JSON logging via Logrus
- **Metrics**: Notifications sent, delivery success rate, error rates
- **Health**: Worker health is monitored via Assemble agent

## Related Documentation

- [Workers Overview](../README.md)
- [Envoy Client](../../libs/go-messaging/envoy/README.md)
- [Notification Templates](./templates/README.md) (if exists)
- [Architecture Overview](../../docs/architecture/README.md)
