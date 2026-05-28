# Rune Server Setup Guide

End-to-end instructions for provisioning the Propeller Rune server on DigitalOcean.

## Prerequisites

- DigitalOcean API token (write scope)
- Terraform ≥ 1.9
- SSH key registered in DigitalOcean named `oreofe-mac`
- GitHub personal access token with `read:packages` scope (for GHCR image pulls)

Set registry credentials via env vars before applying. Credentials are stored in an encrypted Rune Secret (not inline plaintext):

```bash
export TF_VAR_docker_registries='[{"name":"ghcr","registry":"ghcr.io","from_secret":"ghcr-credentials","bootstrap":true,"data":{"username":"GITHUB_USERNAME","password":"${GHCR_PAT}"}}]'
export TF_VAR_runed_environment='{"GHCR_PAT":"ghp_your_pat_here"}'
```

On first start, runed creates the `ghcr-credentials` Secret from the bootstrap data and resolves it at pull time. The PAT never lands in the runefile or Terraform state as cleartext.

## 1. Provision the Droplet

```bash
cd infra/terraform/do
terraform init
terraform apply
```

This creates:
- Rune droplet (Ubuntu 24.04, s-2vcpu-4gb, lon1) via `runestack/rune/digitalocean` v0.0.5
- Flo droplet (Ubuntu 24.04, s-1vcpu-1gb, lon1) via `floruntime/flo/digitalocean` v0.0.2
- Docker registry credentials stored in an encrypted Rune Secret (`fromSecret` + bootstrap)
- Reserved (elastic) IP for each — **never change across destroys**
- 10 GB persistent volume attached to Flo
- Firewall (22, 80, 443, 7861, 7863 open) for Rune; (22, 9000, 9002) for Flo

Outputs after apply:
```
rune_reserved_ip = "xxx.xxx.xxx.xxx"
grpc_endpoint = "xxx.xxx.xxx.xxx:7863"
rune_login_command = "rune login rune-dev --server xxx.xxx.xxx.xxx:7863 ..."
flo_reserved_ip = "yyy.yyy.yyy.yyy"
flo_listen_endpoint = "yyy.yyy.yyy.yyy:9000"
flo_dashboard_url = "http://yyy.yyy.yyy.yyy:9002"
```

## 2. Login & Update CI Secrets

```bash
RESERVED_IP=$(terraform output -raw rune_reserved_ip)
ADMIN_TOKEN_FILE="rune-admin.token"

# Login as admin
rune login rune-dev --server $RESERVED_IP:7863 --token-file $ADMIN_TOKEN_FILE --default-namespace dev

# Set GitHub Actions secrets
gh secret set RUNED_HOST --body "$RESERVED_IP:7863" --repo withpropeller/propeller
gh secret set RUNE_TOKEN --body "$(cat $ADMIN_TOKEN_FILE)" --repo withpropeller/propeller
```

## 3. Set Application Secrets

```bash
# Interactive guided setup — prompts for every key:
zake secrets init

# Or set a single key directly:
zake secrets set dev propeller-providers PAYSTACK_SECRET_KEY sk_live_123

# View all secrets:
zake secrets view dev propeller-providers
```

## 4. Deploy Landing to Production

```bash
# Via CI (recommended):
zake deploy prod landing

# Or locally:
python3 -c "..." | rune cast /tmp/landing-prod.yaml -n prod --create-namespace --force
```

## 5. Update DNS

Update the `hyphenmoney.com` A record in Cloudflare to point to the Reserved IP.
ACME (Let's Encrypt) will auto-issue a certificate within a few minutes.

Verify:
```bash
curl -sH "Host: hyphenmoney.com" http://$RESERVED_IP/ | head -5
curl -sI https://hyphenmoney.com
```

## Tear Down

> **⚠️ Reserved IPs and the Flo volume have `prevent_destroy = true`.**
> To destroy them, first remove the `lifecycle { prevent_destroy = true }` blocks in `main.tf`.

```bash
cd infra/terraform/do
terraform destroy -auto-approve
```

The reserved IPs and volume will be released. Next `terraform apply` gets new ones — update DNS accordingly.

> **⚠️ Let's Encrypt rate limit:** LE allows **5 certificates per exact domain per 7 days**.
> Destroying and recreating the server repeatedly will exhaust this quota.
> After hitting the limit, cert issuance will fail with `429 rateLimited` and you must wait out the window.
> Check remaining quota at: https://crt.sh/?q=hyphenmoney.com

## Terraform Resources

| Resource | Purpose |
|---|---|
| `module.rune.digitalocean_droplet` | DO droplet running runed |
| `module.rune.digitalocean_firewall` | Ingress rules for SSH, HTTP, HTTPS, API |
| `digitalocean_reserved_ip.rune` | Elastic IP — survives droplet destroys |
| `digitalocean_reserved_ip_assignment.rune` | Attaches reserved IP to droplet |
| `module.rune.null_resource.bootstrap` | SSH + `rune admin bootstrap` on first boot |
| `module.flo.digitalocean_droplet` | DO droplet running flo |
| `module.flo.digitalocean_firewall` | Ingress rules for SSH, wire protocol, dashboard |
| `digitalocean_reserved_ip.flo` | Elastic IP for Flo — survives droplet destroys |
| `digitalocean_reserved_ip_assignment.flo` | Attaches reserved IP to Flo droplet |
| `module.flo.digitalocean_volume` | 10 GB persistent volume mounted at `/var/lib/flo` |

## Environments

The `environment` variable in `terraform.tfvars` controls:
- Droplet name: `rune-{environment}`
- Bootstrap namespace: `{environment}`
- Tags: `rune-{environment}`

Currently `environment = "dev"`.
