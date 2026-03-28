#!/usr/bin/env sh
set -eu

# Run twice daily via cron or systemd timer (see infra/systemd/).
# Renews certs if due, then reloads nginx so new certs are picked up.

cd "$(dirname "$0")/../.."

docker compose run --rm certbot renew --webroot -w /var/www/certbot --quiet
docker compose exec nginx nginx -s reload
