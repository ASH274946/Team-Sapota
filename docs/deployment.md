# VedaAI Deployment Guide

This guide details the processes required to deploy the VedaAI monorepo to production environments.

## 1. Hosting Platforms
- **Frontend App**: Deployed to **Vercel** as a Next.js application.
- **Backend Service & Workers**: Deployed to **Render** via Docker / native Node services as configured in `render.yaml`.
- **Database**: PostgreSQL database hosted on **Neon**.
- **Redis Cache**: Queue and WebSocket transport hosted on **Upstash**.

## 2. Production Build Commands

To build the entire monorepo:
```bash
# Build backend (prisma client generation & tsc compilation)
npm run build --workspace vedaai-backend

# Build frontend (Next.js compilation)
npm run build --workspace frontend
```
