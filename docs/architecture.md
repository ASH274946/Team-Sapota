# VedaAI Architecture

VedaAI is a production-grade full-stack AI-powered educational assessment platform. This document outlines the application layers, data flow, repository structure, and key architectural choices.

## 1. System Topology

```mermaid
graph TD
  User([Educator / Admin Client]) -->|HTTPS / WSS| FE[Next.js Frontend]
  FE -->|REST API / WebSockets| BE[Express.js Backend]
  BE -->|ORM / SQL| DB[(PostgreSQL Database)]
  BE -->|Queue Events| Redis[(Upstash Redis)]
  Redis <--> Workers[BullMQ Worker Pool]
  Workers -->|LLM Requests| LLM[AI Inference Providers]
  Workers -->|PDF Generation| Chromium[Puppeteer / Headless Chrome]
```

## 2. Directory Layout

The codebase is organized as an npm workspaces monorepo:

```txt
├── apps/
│   ├── frontend/         # Next.js 16 App Router UI
│   └── backend/          # Express/Prisma API Server & Workers
├── docs/                 # Consolidated documentation
└── package.json          # Workspace configuration
```

## 3. Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **State Management**: Zustand 5.x
- **Styling**: TailwindCSS 4.x
- **Micro-Interactions**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation
- **Real-Time Client**: Socket.IO Client

### Backend
- **Runtime**: Node.js 20.x (TypeScript 5.x)
- **Framework**: Express.js 4.x
- **Database ORM**: Prisma Client
- **Background Tasks**: BullMQ 5.x backed by Upstash Redis
- **Real-Time Gateway**: Socket.IO 4.7.x
- **Password Hashing & Cryptography**: Argon2

### Database & Third-Party Services
- **Database**: PostgreSQL (Neon Database)
- **AI Services**: Anthropic (Claude), Nvidia, and Groq API engines
- **Storage Service**: AWS S3 (for document uploads/downloads) or Local Disk
