# Runbook

## Start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

## Admin
- Admin user otomatis dibuat dari env:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- Admin panel: `http://localhost:8080/admin`

## Crawler
- Worker jalan di container `worker` (Celery).
- Scheduler jalan di container `beat` (Celery beat), default trigger crawling sources setiap 30 menit.\n
Jika kamu ingin crawl manual: buka admin panel dan klik **Trigger** pada source.

