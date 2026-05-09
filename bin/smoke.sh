#!/usr/bin/env bash
# bin/smoke.sh — hit every healthz endpoint after `zake dev` boots.
# Exit non-zero on any failure.

set -uo pipefail

endpoints=(
  "http://localhost:9002/health|flo dashboard"
  "http://localhost:3001/healthz|apps/api"
  "http://localhost:3002/healthz|apps/services"
  "http://localhost:3003/healthz|apps/office"
  "http://localhost:3000/|apps/dashboard (vite)"
  "http://localhost:3005/|apps/admin (vite)"
  "http://localhost:3004/|apps/docs (Scalar)"
  "http://localhost:8080/|caddy edge"
)

failed=0
for entry in "${endpoints[@]}"; do
  url="${entry%%|*}"
  label="${entry##*|}"
  printf "%-32s %-50s " "$label" "$url"
  if curl -sfo /dev/null --max-time 5 "$url"; then
    printf "ok\n"
  else
    printf "DOWN\n"
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  echo
  echo "Some endpoints are unhealthy. Try:"
  echo "  zake ps"
  echo "  zake logs"
  exit 1
fi

echo
echo "All Propeller services healthy."
