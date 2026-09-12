# Production Simulation with Docker Compose

## Prerequisites
- Docker & Docker Compose v2
- At least 4 GB RAM allocated to Docker

## Services
| Service      | Image                     | Purpose                     |
| ------------ | ------------------------- | --------------------------- |
| **PostgreSQL 16** | `postgres:16-alpine`    | Primary database            |
| **Redis 7**  | `redis:7-alpine`          | Cache + BullMQ queue backend |
| **VidyaAI API** | `vidyaai-backend:latest` | Backend application         |

## Quick Start

```bash
# 1. Copy environment file and fill in secrets
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Run database migrations
npx prisma migrate deploy

# 4. Verify health
curl http://localhost:4000/health
```

## Docker Compose Configuration

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: vidyaai-postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
      POSTGRES_DB: vidyaai
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: vidyaai-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: ["redis-server", "--appendonly", "yes", "--maxmemory", "256mb", "--maxmemory-policy", "noeviction"]
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  api:
    image: vidyaai-backend:latest
    container_name: vidyaai-api
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    env_file:
      - ./apps/backend/.env
    environment:
      NODE_ENV: production
      PORT: "4000"
      REDIS_URL: "redis://redis:6379"
      REDIS_BULLMQ_URL: "redis://redis:6379"
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:4000/health/live', r => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## Environment Variables

See `.env.example` for all required variables. Key overrides for Docker:

| Variable               | Docker Value                      |
| ---------------------- | --------------------------------- |
| `REDIS_URL`            | `redis://redis:6379`              |
| `REDIS_BULLMQ_URL`     | `redis://redis:6379`              |
| `DATABASE_URL`         | `postgresql://postgres:password@postgres:5432/vidyaai` |
| `NODE_ENV`             | `production`                      |

## Multi-stage Dockerfile

Place `apps/backend/Dockerfile`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json prisma/ ./
RUN npx prisma generate
COPY src/ src/
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/dist dist/
COPY --from=builder /app/prisma prisma/
USER nodeuser
EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "dist/app.js"]
```
