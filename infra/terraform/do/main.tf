# ── Reserved IP ──────────────────────────────────────────────────
# Survives droplet destroys — DNS points here once, never changes.
resource "digitalocean_reserved_ip" "rune" {
  region = var.region

  lifecycle {
    prevent_destroy = true
  }
}

resource "digitalocean_reserved_ip_assignment" "rune" {
  ip_address = digitalocean_reserved_ip.rune.ip_address
  droplet_id = module.rune.droplet_id
}

module "rune" {
  source  = "runestack/rune/digitalocean"
  version = "0.0.8"

  # ── Required ───────────────────────────────────────────────
  ssh_key_ids = [data.digitalocean_ssh_key.main.id]

  # ── Node ───────────────────────────────────────────────────
  node_role    = var.node_role
  acme_email   = var.acme_email
  environment  = var.environment
  region       = var.region
  droplet_size = var.droplet_size
  image        = var.image
  rune_version = var.rune_version
  cluster_cidr = var.cluster_cidr

  # ── Docker registries ──────────────────────────────────────
  docker_registries = var.docker_registries
  runed_environment = var.runed_environment

  # ── Bootstrap ──────────────────────────────────────────────
  bootstrap                 = var.bootstrap
  bootstrap_ssh_private_key = file("~/.ssh/id_ed25519")
  bootstrap_token_path      = "rune-admin.token"
  bootstrap_namespace       = var.environment

  # ── Firewall ───────────────────────────────────────────────
  ssh_allowed_cidrs = var.ssh_allowed_cidrs
  api_allowed_cidrs  = var.api_allowed_cidrs

  # ── Production ─────────────────────────────────────────────
  enable_backups    = var.enable_backups
  enable_monitoring = var.enable_monitoring
  project_id        = var.project_id
  tags              = var.tags
}

