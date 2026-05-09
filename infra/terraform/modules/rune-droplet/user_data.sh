#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------
# Rune User Data Script — Official Installer
#
# Installs Rune Server (runed) on a cloud VM using the
# official install-server.sh script.
#
# Compatible with Ubuntu 22.04+ and Debian 11+
# ------------------------------------------------------------

RUNE_VERSION="${rune_version}"
GIT_BRANCH="${git_branch}"

exec > >(tee -a /var/log/user-data.log) 2>&1

echo "============================================"
echo "  Rune Installation"
echo "  Started at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================"

if ! command -v curl >/dev/null 2>&1; then
    apt-get update -y -qq && apt-get install -y -qq curl
fi

if [ -n "$RUNE_VERSION" ]; then
    echo "Installing Rune version: $RUNE_VERSION"
    curl -fsSL https://raw.githubusercontent.com/runestack/rune/master/scripts/install-server.sh | bash -s -- --version "$RUNE_VERSION"
else
    echo "Installing Rune from source (branch: $GIT_BRANCH)"
    curl -fsSL https://raw.githubusercontent.com/runestack/rune/master/scripts/install-server.sh | bash -s -- --from-source --branch "$GIT_BRANCH"
fi

# Allow runed to bind low ports (80, 443) without root
setcap 'cap_net_bind_service=+ep' /usr/local/bin/runed

# Replace systemd-resolved stub with real resolv.conf so Rune DNS works
cat > /etc/resolv.conf << 'RESOLV'
nameserver 67.207.67.3
nameserver 67.207.67.2
options edns0 trust-ad
RESOLV

# Configure runed as an edge node with networking + ACME
mkdir -p /etc/rune
cat > /etc/rune/runefile.toml << 'RUNEFILE'
data_dir = "/var/lib/rune"

[server]
grpc_address = ":7863"
http_address = ":7861"

[log]
level = "info"
format = "text"

[networking]
cluster_cidr = "10.96.0.0/16"

[telemetry]
metrics_addr = "127.0.0.1:9100"

[node]
role = "edge"

[acme]
email = "oreofeolurin@gmail.com"
RUNEFILE

# Update systemd unit to use the runefile
cat > /etc/systemd/system/runed.service << 'UNIT'
[Unit]
Description=Rune Server
After=network-online.target docker.service
Wants=network-online.target docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/runed --config /etc/rune/runefile.toml
Restart=on-failure
RestartSec=5s
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl restart runed

sleep 5

echo ""
echo "🎉 Rune installation completed!"
echo "  gRPC:       $(hostname -I | awk '{print $1}'):7863"
echo "  HTTP:       http://$(hostname -I | awk '{print $1}'):7861"
echo "  Dashboard:  http://$(hostname -I | awk '{print $1}'):7862"
echo "  Logs:       journalctl -u runed -f"
echo "  User data:  /var/log/user-data.log"
