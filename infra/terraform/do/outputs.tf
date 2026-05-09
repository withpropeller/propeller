output "droplet_ipv4" {
  description = "Public IPv4 address of the Rune droplet"
  value       = module.rune.ipv4_address
}

output "droplet_ipv6" {
  description = "Public IPv6 address of the Rune droplet"
  value       = module.rune.ipv6_address
}

output "grpc_endpoint" {
  description = "Rune gRPC endpoint (for CLI login)"
  value       = module.rune.grpc_endpoint
}

output "http_endpoint" {
  description = "Rune HTTP endpoint"
  value       = module.rune.http_endpoint
}

output "rune_login_command" {
  description = "Ready-to-paste rune login command"
  value       = module.rune.rune_login_command
}

output "droplet_name" {
  description = "Droplet name (rune-<environment>)"
  value       = module.rune.droplet_name
}
