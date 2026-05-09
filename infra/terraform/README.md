# infra/terraform/

Terraform configuration for Propeller's DigitalOcean infrastructure.

## Layout

```
terraform/
├── modules/
│   └── rune-droplet/          # Reusable droplet module
│       ├── main.tf            # Droplet + firewall + user-data
│       ├── variables.tf       # Module inputs
│       ├── outputs.tf         # Module outputs (IPs, endpoints)
│       └── user_data.sh       # Cloud-init: installs Rune via official installer
├── do/                        # Live deployment (dev/prod)
│   ├── provider.tf            # DO provider + SSH key lookup
│   ├── main.tf                # Calls module rune-droplet
│   ├── variables.tf           # Environment variables
│   ├── outputs.tf             # Pass-through outputs from module
│   ├── terraform.tfvars       # Your filled-in values (DO NOT COMMIT)
│   └── terraform.tfvars.example
└── README.md                  # This file
```

## What gets provisioned

| Resource | Details |
|---|---|
| **Droplet** | Ubuntu 24.04, configurable size (default `s-1vcpu-1gb`) |
| **Firewall** | Inbound: 22 (SSH), 7861 (HTTP), 7863 (gRPC), 8080 (app) |
| **User data** | Installs Docker, Rune server (`runed`), Rune CLI — via the official `install-server.sh` |
| **Project** | Assigns droplet to a DO project (optional) |

## Prerequisites

1. [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5
2. A [DigitalOcean personal access token](https://cloud.digitalocean.com/account/api/tokens) with read/write scope
3. An [SSH key uploaded to DigitalOcean](https://cloud.digitalocean.com/account/security) — the Terraform config looks it up by name, see below

### Getting your SSH key name

```sh
# List keys via the API (replace with your token)
curl -s https://api.digitalocean.com/v2/account/keys \
  -H "Authorization: Bearer <YOUR_DO_TOKEN>" | python3 -m json.tool
```

## Quick start

```bash
# 1. Copy and fill in the tfvars
cp do/terraform.tfvars.example do/terraform.tfvars
# Edit do/terraform.tfvars — set do_token, ssh_key_name, region, etc.

# 2. Initialize
terraform -chdir=do init

# 3. Preview
terraform -chdir=do plan

# 4. Apply
terraform -chdir=do apply
```

Terraform outputs the droplet IP and Rune endpoints:

```
droplet_ipv4  = "134.209.xx.xx"
grpc_endpoint = "134.209.xx.xx:7863"
http_endpoint = "http://134.209.xx.xx:7861"
```

## Post-provisioning: bootstrap Rune access

After the droplet is up, you need to mint a root admin token. This is a one-time operation per server — `rune admin bootstrap` is the only unauthenticated RPC on a fresh `runed`.

```bash
# 1. Bootstrap on the droplet
ssh root@<DROPLET_IP> 'rune admin bootstrap --out-file /tmp/admin.token'

# 2. Copy the token locally
scp root@<DROPLET_IP>:/tmp/admin.token ./admin.token

# 3. Login from your machine
rune login propeller \
  --server <DROPLET_IP>:7863 \
  --token-file ./admin.token \
  --namespace propeller

# 4. Verify
rune whoami
# → Status: Authenticated, Name: root, Policies: [root]
```

## Deploy Propeller services

Once authenticated, deploy the runeset:

```bash
# Create secrets & configmaps (one-time per environment)
rune cast infra/runeset/secrets.yaml       # fill in from secrets.example.yaml first
rune cast infra/runeset/configs.yaml       # fill in from configs.example.yaml first

# Deploy services
rune cast infra/runeset/ --values=infra/runeset/values/dev.yaml
```

## Troubleshooting

### Rune installation didn't complete

The cloud-init user_data runs on first boot. Check progress:

```bash
ssh root@<DROPLET_IP> 'tail -f /var/log/user-data.log'
```

### runed service not running

```bash
ssh root@<DROPLET_IP> 'systemctl status runed --no-pager'
ssh root@<DROPLET_IP> 'journalctl -u runed -n 50 --no-pager'
```

### Can't reach gRPC/HTTP from outside

The firewall restricts inbound to `allowed_cidr`. Verify your IP matches the CIDR, or update `allowed_cidr` in `terraform.tfvars` and re-apply.

### Build-from-source is slow

Set `rune_version = "v0.0.1-dev.12"` (or latest) in `terraform.tfvars` to download a pre-built binary instead of compiling Go from source on the droplet.

```sh
# List available releases
curl -sL https://api.github.com/repos/runestack/rune/releases | python3 -c "import sys,json; [print(r['tag_name']) for r in json.load(sys.stdin)]" | head -10
```

### CLI config wasn't copied automatically

```bash
ssh root@<DROPLET_IP>
sudo mkdir -p ~/.rune
sudo cp /var/lib/rune/.rune/config.yaml ~/.rune/config.yaml
sudo chown -R $USER:$USER ~/.rune
chmod 700 ~/.rune && chmod 600 ~/.rune/config.yaml
rune status
```

## Variables reference

| Variable | Default | Description |
|---|---|---|
| `do_token` | — (**required**, sensitive) | DigitalOcean API token |
| `ssh_key_name` | — (**required**) | Name of SSH key in DO account |
| `region` | `lon1` | DO region slug |
| `droplet_size` | `s-1vcpu-1gb` | Droplet size slug |
| `image` | `ubuntu-24-04-x64` | Droplet OS image |
| `environment` | `dev` | Tags droplet name/firewall (`rune-dev`, `rune-prod`, etc.) |
| `allowed_cidr` | `0.0.0.0/0` | CIDR for inbound SSH/API |
| `enable_backups` | `false` | Weekly DO backups ($1/mo) |
| `enable_monitoring` | `true` | DO agent monitoring |
| `project_id` | `""` | DO project ID to assign droplet to |
| `rune_version` | `""` | Release tag (e.g. `v0.0.1-dev.12`); empty = build from source |
| `git_branch` | `master` | Branch used when building from source |

## Tear down

```bash
terraform -chdir=do destroy
```
