# Enterprise AI Education Platform - Deployment Guide

This document outlines the production deployment strategy for the Vidya AI Education Platform. The architecture is a multi-container Docker deployment orchestrated via Kubernetes (EKS) or Docker Compose for single-VM setups.

## Infrastructure Requirements

### Minimum Specifications (Production)
- **Database**: PostgreSQL 15+ (Managed, e.g., AWS RDS or Supabase). Minimum 4GB RAM, 100GB Storage. PGVector extension MUST be enabled.
- **Cache & Message Broker**: Redis 7+ (Managed, e.g., ElastiCache or Upstash). Minimum 2GB RAM.
- **Backend API**: Node.js 20. Minimum 2 CPUs, 4GB RAM.
- **Background Workers**: Node.js 20. Minimum 4 CPUs, 8GB RAM (OCR and heavy AI routing).
- **Frontend**: Next.js (Vercel, AWS Amplify, or ECS).

## Environment Variables

### Core
- `NODE_ENV=production`
- `PORT=8000`

### Database & Redis
- `DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public`
- `REDIS_URL=redis://default:pass@host:6379`

### AI Providers
- `NVIDIA_NIM_API_KEY=nvapi-...`
- `GROQ_API_KEY=gsk_...`

### Security
- `JWT_SECRET=super_secure_random_string`
- `JWT_EXPIRES_IN=24h`
- `CORS_ORIGIN=https://app.vidya-ai.com`

### PDF Generation & Worker
- `CHROMIUM_PATH=/usr/bin/chromium-browser` (Required for Alpine Linux / Docker Fargate environments)
- `PDF_WORKER_CONCURRENCY=2` (Number of concurrent Puppeteer PDF rendering jobs per worker node)

## Docker Deployment (Single Node / Testing)

A `docker-compose.prod.yml` file is provided in the repository root.

```bash
# 1. Build the images
docker-compose -f docker-compose.prod.yml build

# 2. Run database migrations
docker-compose -f docker-compose.prod.yml run backend npx prisma migrate deploy

# 3. Start the services
docker-compose -f docker-compose.prod.yml up -d
```

## Production Architecture (AWS)

1. **VPC**: Deploy the backend and workers in private subnets. Only the Application Load Balancer (ALB) should reside in the public subnet.
2. **ECS/Fargate**: Deploy the `backend` image as a web service, and the `worker` image as a background service.
3. **RDS PostgreSQL**: Deploy in Multi-AZ configuration with automated daily backups.
4. **ElastiCache Redis**: Use a replication group for High Availability.
5. **Vercel / CloudFront**: Deploy the Next.js `frontend` app via Vercel for optimal Edge caching, or containerize it and place it behind a CloudFront CDN.

## Monitoring & Observability

- **System Health**: Access the Enterprise Admin Dashboard (`/dashboard/admin/system-health`) to monitor BullMQ queue depth and Redis connection status.
- **Logs**: All backend logs are output to `stdout` in JSON format. Use Datadog or AWS CloudWatch to ingest and alert on `ERROR` level logs.
- **AI Latency**: Monitor the `/dashboard/admin/providers` endpoint to track NVIDIA NIM and Groq latency and token usage. Fallbacks are configured automatically in the `AIOrchestrator`.

## SSL / TLS
All traffic MUST run over HTTPS. Terminate SSL at the Application Load Balancer or Reverse Proxy (Nginx/Traefik). Ensure `CORS_ORIGIN` matches the secure frontend domain exactly.
