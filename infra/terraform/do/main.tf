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
  version = "0.0.5"

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

# ── Flo ──────────────────────────────────────────────────────────
# Reserved IP — stable across droplet destroys.
resource "digitalocean_reserved_ip" "flo" {
  region = var.region

  lifecycle {
    prevent_destroy = true
  }
}

resource "digitalocean_reserved_ip_assignment" "flo" {
  ip_address = digitalocean_reserved_ip.flo.ip_address
  droplet_id = module.flo.droplet_id
}

module "flo" {
  source  = "floruntime/flo/digitalocean"
  version = "0.0.2"

  ssh_key_ids = [data.digitalocean_ssh_key.main.id]

  # ── Placement ──────────────────────────────────────────────
  environment  = var.environment
  region       = var.region
  droplet_size = var.flo_droplet_size
  flo_version  = var.flo_version

  # ── Firewall ───────────────────────────────────────────────
  ssh_allowed_cidrs       = var.ssh_allowed_cidrs
  api_allowed_cidrs       = var.api_allowed_cidrs
  dashboard_allowed_cidrs = var.flo_dashboard_allowed_cidrs

  # ── Storage ────────────────────────────────────────────────
  volume_size            = var.flo_volume_size
  volume_name            = var.flo_volume_name
  volume_filesystem_type = var.flo_volume_filesystem_type

  # ── Production ─────────────────────────────────────────────
  enable_backups    = var.enable_backups
  enable_monitoring = var.enable_monitoring
  project_id        = var.project_id
  tags              = var.tags
}
