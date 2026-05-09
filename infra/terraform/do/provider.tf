terraform {
  required_version = ">= 1.5.0"

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = ">= 2.40, < 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.4"
    }
    null = {
      source  = "hashicorp/null"
      version = ">= 3.2"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

# Look up SSH key by name
data "digitalocean_ssh_key" "main" {
  name = var.ssh_key_name
}
