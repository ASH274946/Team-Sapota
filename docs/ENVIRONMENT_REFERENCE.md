# VedaAI Environment Variables Reference

This document maps the configuration variables required to run the VedaAI monorepo.

## 1. Backend Environment Variables (`apps/backend/.env`)

### System & Framework
- `PORT`: Network port for Express server (default `3001`).
- `NODE_ENV`: Runtime mode (e.g. `development`, `production`).

### Data Stores
- `DATABASE_URL`: Connection string for PostgreSQL database.
- `REDIS_URL`: Endpoint for general key-value storage and cache.
- `REDIS_BULLMQ_URL`: Dedicated endpoint for BullMQ queue operations.

### Security
- `JWT_SECRET`: Hexadecimal key for JWT signing.
- `JWT_EXPIRES_IN`: Token lifespan definition (e.g. `7d`).

### AI Integrations
- `NVIDIA_API_KEY`: API credentials for Nvidia Llama models.
- `GROQ_API_KEY`: Inference credentials for Groq speed fallbacks.
- `AI_ENGINE_URL`: Downstream URL pointing to Python AI scoring microservices.

### Storage Configurations
- `STORAGE_TYPE`: Mode of media storage (`local` vs `S3`).
- `UPLOAD_DIR`: Local folder path for file uploads (used when `STORAGE_TYPE` is `local`).

### Async Processing
- `ENABLE_BACKGROUND_WORKERS`: Toggle background BullMQ generation threads (`true`/`false`).
- `AI_WORKER_CONCURRENCY`: Concurrency limit for AI generator jobs.
- `PDF_WORKER_CONCURRENCY`: Concurrency limit for PDF generator jobs.
- `RENDER_WORKER_MODE`: Worker role descriptor (`api`, `worker`, or `both`).
