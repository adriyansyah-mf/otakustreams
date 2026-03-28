.PHONY: ssl-init ssl-renew

# Isi CERTBOT_EMAIL + CERTBOT_DOMAINS di .env lalu:
ssl-init:
	sh infra/scripts/init-letsencrypt.sh

ssl-renew:
	sh infra/scripts/renew-letsencrypt.sh
