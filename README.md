# Otakunesia (MVP)

Monorepo untuk web streaming anime + baca manga dengan crawler background.

## Quick start (Docker)

1. Copy env:

```bash
cp .env.example .env
```

2. Jalankan:

```bash
docker compose up --build
```

3. URL:
- Web: `http://localhost`
- API: `http://localhost/api`

## Services
- `web`: Next.js (SSR/SEO)
- `api`: FastAPI (REST API)
- `worker`: Celery worker (crawler)
- `beat`: Celery beat (scheduler)
- `postgres`: database
- `redis`: queue/cache
- `nginx`: reverse proxy

## SSL (Let's Encrypt)

Konfigurasi project sudah support HTTPS di `otakunesia.com` + `www.otakunesia.com`.

1. Pastikan DNS `A record` untuk kedua domain mengarah ke IP VPS.
2. Jalankan bootstrap sertifikat:

```bash
sh infra/scripts/init-letsencrypt.sh otakunesia.com your-email@domain.com
```

3. Start semua service:

```bash
docker compose up -d --build
```

4. Auto-renew (crontab host VPS):

```bash
0 3 * * * cd /path/to/otakustream && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

