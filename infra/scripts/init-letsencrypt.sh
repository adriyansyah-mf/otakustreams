#!/usr/bin/env sh
set -eu

# Usage:
#   sh infra/scripts/init-letsencrypt.sh otakunesia.com admin@otakunesia.com

DOMAIN="${1:-otakunesia.com}"
EMAIL="${2:-}"
WWW_DOMAIN="www.${DOMAIN}"
RSA_KEY_SIZE=4096

if [ -z "$EMAIL" ]; then
  echo "Email is required. Example:"
  echo "  sh infra/scripts/init-letsencrypt.sh otakunesia.com admin@otakunesia.com"
  exit 1
fi

CERT_PATH="./infra/certbot/conf/live/${DOMAIN}"

echo "==> Creating dummy certificate for ${DOMAIN} (bootstrap)"
mkdir -p "$CERT_PATH"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "${CERT_PATH}/privkey.pem" \
  -out "${CERT_PATH}/fullchain.pem" \
  -subj "/CN=localhost" >/dev/null 2>&1

echo "==> Starting nginx for ACME challenge"
docker compose up -d nginx

echo "==> Removing dummy certificate"
rm -f "${CERT_PATH}/privkey.pem" "${CERT_PATH}/fullchain.pem"

echo "==> Requesting Let's Encrypt certificate"
docker compose run --rm certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --email "$EMAIL" \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN" \
  --rsa-key-size "$RSA_KEY_SIZE" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

echo "==> Reloading nginx with real certificate"
docker compose restart nginx

echo "Done. SSL active for https://${DOMAIN}"
