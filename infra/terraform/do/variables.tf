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
