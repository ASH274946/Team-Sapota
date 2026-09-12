# Production Readiness Checklist

## Environment & Configuration
- [ ] All environment variables documented in `.env.example`
- [ ] `JWT_SECRET` set to a strong random string (≥32 chars, not the dev default)
- [ ] `DATABASE_URL` configured with production Supabase connection string (port 6543 with `sslmode=require`)
- [ ] `REDIS_URL` and `REDIS_BULLMQ_URL` configured (TCP Redis, not REST API)
- [ ] At least one AI provider key set: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `NVIDIA_API_KEY`, `GROQ_API_KEY`
- [ ] `FRONTEND_URL` set to production frontend domain(s), comma-separated
- [ ] `NODE_ENV=production`
- [ ] `ENABLE_BACKGROUND_WORKERS` set appropriately
- [ ] `AI_WORKER_CONCURRENCY` tuned for instance size (1–4, validated via Zod)
- [ ] `PDF_WORKER_CONCURRENCY` tuned for instance size (1–2, validated via Zod)
- [ ] `RENDER_WORKER_MODE` configured (`web`, `worker`, or `both`)

## Security
- [ ] HTTPS enabled via reverse proxy (nginx, Cloudflare, or LB)
- [ ] CORS origins restricted to known frontend domains (validated at startup in production)
- [ ] Helmet CSP configured — currently allows `'unsafe-inline'` and `'unsafe-eval'` for scripts
- [ ] CSRF protection enabled (double-submit cookie pattern)
- [ ] Rate limiting thresholds tuned (`express-rate-limit`, currently 100 req/15min on `/api`)
- [ ] Upload file type/size limits set (`multer`, currently 1 MB JSON body limit)
- [ ] Secrets managed via environment variables (Zod schema validates on startup)
- [ ] `.env` files excluded from version control (`.gitignore` verified: `*.env`, `.env`)
- [ ] Redis TLS configured with `rejectUnauthorized: false` — enable proper certificates for production
- [ ] Database connection uses TLS (Supabase requires `sslmode=require`)

## Database
- [ ] Prisma migrations applied (`npx prisma migrate deploy`)
- [ ] Database indexes created (run migrations, verify query plans)
- [ ] Connection pool size configured (via Supabase pooler, port 6543)
- [ ] Soft delete strategy implemented for regulated data
- [ ] Backup strategy documented (see `DISASTER_RECOVERY.md`)
- [ ] Read replica configured (if high traffic)

## Queue Workers
- [ ] BullMQ queues configured with proper Redis (`generation`, `pdf`, `ingestion`)
- [ ] Worker concurrency tuned (`AI_WORKER_CONCURRENCY`, `PDF_WORKER_CONCURRENCY`)
- [ ] Dead letter queue monitoring set up
- [ ] Job retry policies configured (stalled jobs detected via `QueueEvents`)
- [ ] Queue timeout watchdog enabled (sweeps stale queued/in-progress jobs every `QUEUE_SWEEP_INTERVAL_MS`)
- [ ] Stalled job monitoring configured (logs stalled count every `STALL_MONITOR_INTERVAL_MS`)

## Monitoring
- [ ] Health endpoints accessible (`/health`, `/health/live`, `/health/ready`)
- [ ] `/health/ready` checks database (`SELECT 1`) and Redis connection
- [ ] `/health` reports service phase, uptime, and per-service status
- [ ] Metrics endpoint configured
- [ ] Structured logging via pino to stdout (with `pino-http` for HTTP request logging)
- [ ] Request IDs enabled (`X-Request-Id` header, `crypto.randomUUID()` fallback)
- [ ] AI cost tracking enabled
- [ ] Error tracking service configured (Sentry or similar)

## Deployment
- [ ] Dockerfile optimized (multi-stage build) — **not yet created** (see `DOCKER_COMPOSE_GUIDE.md`)
- [ ] Docker compose configured for local production simulation (see `DOCKER_COMPOSE_GUIDE.md`)
- [ ] CI/CD pipeline configured
- [ ] Database migration run as part of deployment (`prisma migrate deploy`)
- [ ] Rollback strategy documented
- [ ] Health checks configured in orchestrator (`/health/live` for liveness, `/health/ready` for readiness)
- [ ] Resource limits set (CPU, memory) — PM2 configured with `max_memory_restart: 512M`
- [ ] Horizontal scaling strategy documented (web vs worker mode via `RENDER_WORKER_MODE`)

## Performance
- [ ] Caching layer configured (Redis via `ioredis`)
- [ ] Response compression enabled (`compression` middleware)
- [ ] Static assets served via CDN (if applicable)
- [ ] Database query optimization reviewed
- [ ] N+1 query patterns addressed (Prisma with `include`/`select`)
- [ ] Connection pooling configured (Supabase pooler or `pg` pool)

## Testing
- [ ] Unit tests passing (`vitest run`)
- [ ] Integration tests passing
- [ ] Load tests completed with acceptable results
- [ ] Security tests passing
- [ ] API documentation (OpenAPI/Swagger) up to date

## Disaster Recovery
- [ ] Database backup schedule configured (see `DISASTER_RECOVERY.md`)
- [ ] Backup restoration tested
- [ ] Recovery runbook documented (see `DISASTER_RECOVERY.md`)
