# OtakuStream (MVP)

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
- Web: `http://localhost:8080`
- API: `http://localhost:8080/api`

## Services
- `web`: Next.js (SSR/SEO)
- `api`: FastAPI (REST API)
- `worker`: Celery worker (crawler)
- `beat`: Celery beat (scheduler)
- `postgres`: database
- `redis`: queue/cache
- `nginx`: reverse proxy

