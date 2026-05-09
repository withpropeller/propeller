terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.40"
    }
  }
}

resource "digitalocean_droplet" "rune" {
  image    = var.image
  name     = "rune-${var.environment}"
  region   = var.region
  size     = var.droplet_size
  ssh_keys = [var.ssh_key_id]

  monitoring = var.enable_monitoring
  backups    = var.enable_backups

  user_data = templatefile("${path.module}/user_data.sh", {
    rune_version = var.rune_version
    git_branch   = var.git_branch
  })

  tags = concat(["rune"], var.tags)
}

resource "digitalocean_firewall" "rune" {
  name = "rune-fw-${var.environment}"

  droplet_ids = [digitalocean_droplet.rune.id]

  # SSH
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = [var.allowed_cidr]
  }

  # Rune HTTP API
  inbound_rule {
    protocol         = "tcp"
    port_range       = "7861"
    source_addresses = [var.allowed_cidr]
  }

  # Rune gRPC
  inbound_rule {
    protocol         = "tcp"
    port_range       = "7863"
    source_addresses = [var.allowed_cidr]
  }

  # App HTTP (services deployed via Rune)
  inbound_rule {
    protocol         = "tcp"
    port_range       = "8080"
    source_addresses = [var.allowed_cidr]
  }

  # HTTP
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = [var.allowed_cidr]
  }

  # HTTPS
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = [var.allowed_cidr]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0"]
  }
}

# Optionally assign to a DO project
resource "digitalocean_project_resources" "rune" {
  count   = var.project_id != "" ? 1 : 0
  project = var.project_id
  resources = [
    digitalocean_droplet.rune.urn
  ]
}
