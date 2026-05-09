output "droplet_ipv4" {
  description = "Public IPv4 address of the Rune droplet"
  value       = digitalocean_droplet.rune.ipv4_address
}

output "droplet_ipv6" {
  description = "Public IPv6 address of the Rune droplet"
  value       = digitalocean_droplet.rune.ipv6_address
}

output "droplet_urn" {
  description = "Droplet URN (for project attachment)"
  value       = digitalocean_droplet.rune.urn
}

output "grpc_endpoint" {
  description = "Rune gRPC endpoint (for CLI login)"
  value       = "${digitalocean_droplet.rune.ipv4_address}:7863"
}

output "http_endpoint" {
  description = "Rune HTTP endpoint"
  value       = "http://${digitalocean_droplet.rune.ipv4_address}:7861"
}

output "dashboard_url" {
  description = "Rune dashboard"
  value       = "http://${digitalocean_droplet.rune.ipv4_address}:7862"
}
