#!/usr/bin/env sh
set -eu

# Full-auto friendly: set CERTBOT_EMAIL + CERTBOT_DOMAINS in .env (repo root), then:
#   sh infra/scripts/init-letsencrypt.sh
#
# Or one-shot:
#   sh infra/scripts/init-letsencrypt.sh you@mail.com "otakunesia.com,www.otakunesia.com,otakustream.xyz,www.otakustream.xyz"

cd "$(dirname "$0")/../.."
[ -f .env ] && set -a && . ./.env && set +a

EMAIL="${1:-${CERTBOT_EMAIL:-}}"
DOMAINS_RAW="${2:-${CERTBOT_DOMAINS:-}}"

if [ -z "$EMAIL" ]; then
  echo "Set CERTBOT_EMAIL in .env or pass as first arg."
  exit 1
fi
if [ -z "$DOMAINS_RAW" ]; then
  echo "Set CERTBOT_DOMAINS in .env (comma-separated) or pass as second arg."
  exit 1
fi

# First hostname = folder name under live/ (must match nginx ssl_certificate path)
PRIMARY=""
DOMAIN_ARGS=""
OLDIFS=$IFS
IFS=,
for d in $DOMAINS_RAW; do
  d=$(echo "$d" | tr -d '[:space:]')
  [ -z "$d" ] && continue
  if [ -z "$PRIMARY" ]; then
    PRIMARY=$d
  fi
  DOMAIN_ARGS="$DOMAIN_ARGS -d $d"
done
IFS=$OLDIFS

if [ -z "$PRIMARY" ]; then
  echo "No domains parsed from CERTBOT_DOMAINS"
  exit 1
fi

RSA_KEY_SIZE=4096
CERT_PATH="./infra/certbot/conf/live/${PRIMARY}"

echo "==> Primary (cert storage): ${PRIMARY}"
echo "==> Requesting SANs:${DOMAIN_ARGS}"

echo "==> Creating dummy certificate for ${PRIMARY} (bootstrap nginx)"
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
# shellcheck disable=SC2086
docker compose run --rm certbot certonly --webroot \
  --webroot-path /var/www/certbot \
  --email "$EMAIL" \
  $DOMAIN_ARGS \
  --rsa-key-size "$RSA_KEY_SIZE" \
  --agree-tos \
  --no-eff-email \
  --force-renewal

echo "==> Reloading nginx with real certificate"
docker compose restart nginx

echo "Done. TLS active for: ${DOMAINS_RAW}"
echo "Nginx expects cert at: infra/certbot/conf/live/${PRIMARY}/ (matches PRIMARY in list)"
