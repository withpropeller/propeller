output "reserved_ip" {
  description = "Reserved (elastic) IPv4 — survives droplet destroys"
  value       = digitalocean_reserved_ip.rune.ip_address
}

output "droplet_ipv4" {
  description = "Ephemeral IPv4 of the Droplet (prefer reserved_ip for DNS)"
  value       = module.rune.ipv4_address
}

output "droplet_ipv6" {
  description = "Public IPv6 address of the Rune droplet"
  value       = module.rune.ipv6_address
}

output "grpc_endpoint" {
  description = "Rune gRPC endpoint (for CLI login — uses reserved IP)"
  value       = "${digitalocean_reserved_ip.rune.ip_address}:7863"
}

output "http_endpoint" {
  description = "Rune HTTP endpoint (uses reserved IP)"
  value       = "http://${digitalocean_reserved_ip.rune.ip_address}:7861"
}

output "rune_login_command" {
  description = "Ready-to-paste rune login command (uses reserved IP)"
  value       = "rune login rune-dev --server ${digitalocean_reserved_ip.rune.ip_address}:7863 --token-file ${abspath("rune-admin.token")} --default-namespace dev"
}

# ── Flo ──────────────────────────────────────────────────────────

output "flo_reserved_ip" {
  description = "Flo reserved IPv4 — survives droplet destroys"
  value       = digitalocean_reserved_ip.flo.ip_address
}

output "flo_listen_endpoint" {
  description = "Flo wire-protocol endpoint (host:9000)"
  value       = "${digitalocean_reserved_ip.flo.ip_address}:9000"
}

output "flo_dashboard_url" {
  description = "Flo dashboard URL"
  value       = "http://${digitalocean_reserved_ip.flo.ip_address}:9002"
}

output "droplet_name" {
  description = "Droplet name (rune-<environment>)"
  value       = module.rune.droplet_name
}
