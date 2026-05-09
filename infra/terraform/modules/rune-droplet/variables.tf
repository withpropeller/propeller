variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "region" {
  type        = string
  description = "DigitalOcean region slug"
}

variable "droplet_size" {
  type        = string
  description = "Droplet size slug"
  default     = "s-2vcpu-4gb"
}

variable "image" {
  type        = string
  description = "Droplet image slug"
  default     = "ubuntu-24-04-x64"
}

variable "ssh_key_id" {
  type        = string
  description = "DigitalOcean SSH key ID (data.digitalocean_ssh_key.main.id)"
}

variable "allowed_cidr" {
  type        = string
  description = "CIDR block allowed to access SSH, gRPC, and HTTP ports"
  default     = "0.0.0.0/0"
}

variable "enable_backups" {
  type        = bool
  description = "Enable weekly droplet backups"
  default     = false
}

variable "enable_monitoring" {
  type        = bool
  description = "Enable DO agent monitoring"
  default     = true
}

variable "project_id" {
  type        = string
  description = "Optional DigitalOcean project ID (not name) to assign the droplet to"
  default     = ""
}

variable "tags" {
  type        = list(string)
  description = "Additional DO tags for the droplet"
  default     = []
}

# --- Rune-specific ---

variable "rune_version" {
  type        = string
  description = "Rune release version tag (e.g., v0.1.0). Empty = build from source."
  default     = ""
}

variable "git_branch" {
  type        = string
  description = "Git branch to build Rune from when rune_version is empty"
  default     = "master"
}
