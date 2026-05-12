variable "do_token" {
  type        = string
  description = "DigitalOcean API token. Set via DO_PAT env var."
  sensitive   = true
}

variable "region" {
  type        = string
  description = "DigitalOcean region slug"
  default     = "lon1"
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

variable "ssh_key_name" {
  type        = string
  description = "Name of an existing SSH key in your DigitalOcean account"
}

variable "node_role" {
  type        = string
  description = "Rune node role: edge (binds :80/:443 + ACME) or worker"
  default     = "edge"
}

variable "acme_email" {
  type        = string
  description = "Contact email for Let\u2019s Encrypt (required for edge nodes)"
  default     = "oreofeolurin@gmail.com"
}

variable "environment" {
  type        = string
  description = "Environment label (dev, stg, prod)"
  default     = "dev"
}

variable "rune_version" {
  type        = string
  description = "Rune release tag passed to install-server.sh"
  default     = "v0.0.1-dev.22"
}

variable "cluster_cidr" {
  type        = string
  description = "CIDR used by the Rune networking layer"
  default     = "10.96.0.0/16"
}

variable "bootstrap" {
  type        = bool
  description = "Auto-bootstrap after cloud-init: SSH in, run admin bootstrap, copy token"
  default     = true
}

variable "ssh_allowed_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to reach SSH (port 22)"
  default     = ["0.0.0.0/0", "::/0"]
}

variable "api_allowed_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to reach the Rune gRPC + HTTP API ports"
  default     = ["0.0.0.0/0", "::/0"]
}

variable "enable_backups" {
  type        = bool
  description = "Enable weekly droplet backups"
  default     = false
}

variable "enable_monitoring" {
  type        = bool
  description = "Enable DigitalOcean monitoring agent"
  default     = true
}

variable "project_id" {
  type        = string
  description = "Optional DigitalOcean project ID to attach the droplet to"
  default     = ""
}

variable "tags" {
  type        = list(string)
  description = "Extra droplet tags"
  default     = []
}

variable "docker_registries" {
  type = list(object({
    name                  = string
    registry              = string
    auth_type             = optional(string, "")
    username              = optional(string, "")
    password              = optional(string, "")
    token                 = optional(string, "")
    region                = optional(string, "")
    from_secret           = optional(string, "")
    from_secret_namespace = optional(string, "")
    bootstrap             = optional(bool, false)
    manage                = optional(string, "create")
    immutable             = optional(bool, false)
    data                  = optional(map(string), {})
  }))
  description = "Docker registry credentials rendered into runefile.toml. Use from_secret + bootstrap to store credentials in an encrypted Rune Secret instead of inline plaintext."
  default     = []
  sensitive   = true
}

variable "runed_environment" {
  type        = map(string)
  description = "Env vars written to /etc/rune/runed.env (mode 0600). Use for $${VAR} references in docker_registries bootstrap data."
  default     = {}
  sensitive   = true
}

# ── Flo ─────────────────────────────────────────────────────────

variable "flo_version" {
  type        = string
  description = "Flo release tag passed to install.sh. Pin in production."
  default     = ""
}

variable "flo_droplet_size" {
  type        = string
  description = "Droplet size for the Flo node"
  default     = "s-1vcpu-1gb"
}

variable "flo_dashboard_allowed_cidrs" {
  type        = list(string)
  description = "CIDRs allowed to reach the Flo dashboard (port 9002). Restrict in production."
  default     = ["0.0.0.0/0", "::/0"]
}

variable "flo_volume_size" {
  type        = number
  description = "GB for the Flo data volume. 0 = root disk (ephemeral). Any positive value provisions a persistent DO Volume."
  default     = 10
}

variable "flo_volume_name" {
  type        = string
  description = "Name for the Flo DO Volume. Empty = auto-derived from droplet name."
  default     = "flo-data"
}

variable "flo_volume_filesystem_type" {
  type        = string
  description = "Filesystem for the Flo volume: ext4 or xfs."
  default     = "ext4"
}
