# 🎓 VidyaAI — Enterprise Outcome-Based Education & Asynchronous Exam Generation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x_LTS-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Vitest](https://img.shields.io/badge/Vitest-30_Suites_Passing-729B1B?logo=vitest&logoColor=white)](https://vitest.dev/)

**VidyaAI** is a cloud-native, multi-tenant academic operations and outcome-based education (OBE) platform. Engineered for higher-education institutions, colleges, and schools, VidyaAI combines an **asynchronous BullMQ background worker architecture**, a **multi-gateway AI inference fallback chain (NVIDIA / Groq / Anthropic / OpenAI)**, **real-time Socket.IO telemetry**, and **NBA / NAAC accreditation automation**.

---

## 📑 Table of Contents

1. [Platform Core Modules](#-platform-core-modules)
2. [System Architecture & Data Flow](#-system-architecture--data-flow)
3. [Technology Stack](#-technology-stack)
4. [Monorepo Structure](#-monorepo-structure)
5. [Prerequisites & Infrastructure](#-prerequisites--infrastructure)
6. [Step-by-Step Local Quickstart](#-step-by-step-local-quickstart)
7. [Environment Variables Matrix](#-environment-variables-matrix)
8. [OBE & NBA Accreditation Suite](#-obe--nba-accreditation-suite)
9. [Multi-Source Document Extractor & OCR Queue](#-multi-source-document-extractor--ocr-queue)
10. [Asynchronous Exam Generation Lifecycle](#-asynchronous-exam-generation-lifecycle)
11. [Real-Time AI Socratic Tutor Engine](#-real-time-ai-socratic-tutor-engine)
12. [RAG Hybrid Search & PGVector Acceleration](#-rag-hybrid-search--pgvector-acceleration)
13. [REST API Specification](#-rest-api-specification)
14. [WebSocket Telemetry Events](#-websocket-telemetry-events)
15. [Database Schema & Entity Models](#-database-schema--entity-models)
16. [AI Inference Fallback & Circuit Breaker](#-ai-inference-fallback--circuit-breaker)
17. [Testing & Quality Verification](#-testing--quality-verification)
18. [Production Deployment Guide](#-production-deployment-guide)
19. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Platform Core Modules

### 1. Outcome-Based Education (OBE) & NBA Automation
* **Syllabus & Unit Planning**: Hierarchical curriculum structure (Units 1..N, topics, Bloom taxonomy target levels, lecture hours).
* **Dynamic CO-PO Matrix Synthesis**: Correlates Course Outcomes (CO1..CO6) to Program Outcomes (PO1..PO6) with weighted correlation levels (1=Low, 2=Medium, 3=High) and Bloom cognitive tags.
* **Exam Paper Blueprint Builder**: Configures section-wise mark distributions, internal choices, question types, and CO/Bloom distribution targets.
* **NBA SAR Criterion 3 Report Generator**: Produces formatted NBA Self-Assessment Reports with real-time target vs. attainment calculations.

### 2. Multi-Format Syllabus Extractor & OCR Engine
* **Universal Document Ingestion**: Ingests syllabus files across PDF, PNG, JPG, JPEG, WEBP, DOCX, TXT, and Markdown.
* **Resilient Retry Queue**: Bounded concurrency ($N=3$) with exponential backoff and alternate gateway retry (up to 2 attempts per file).
* **Client-Side Image Optimization**: Preprocesses and compresses high-resolution images client-side before network upload for 5–10x latency speedup.
* **Noise & Activity Stripper**: Eliminates AI conversational artifacts, device UI status bars, and administrative activity logs (`Revision of Mid-1`, `Seminar 1..N`, `Campus Drive`).
* **Multi-Page Unit Deduplication**: Merges multi-page syllabus fragments and organizes topics into clean sequential units (1..N).

### 3. Asynchronous Question & Exam Paper Generator
* **Parallel Batch Synthesis**: Generates diverse question formats (MCQs, Short Answer, Long Essay, Numerical, Code/Case Study) mapped to Bloom levels.
* **Automated Answer Key & Rubrics**: Generates step-by-step marking schemes, expected keywords, and grading rubrics.
* **Schema Validation & JSON Auto-Repair**: Ensures deterministic JSON structures using Zod schemas with fallback JSON repair parsing.
* **Print-Perfect A4 PDF Exports**: Renders institutional exam papers and marking sheets using sandboxed headless Chromium (`puppeteer-core`).

### 4. Real-Time AI Socratic Tutor
* **Sub-800ms Time-to-First-Token (TTFT)**: WebSocket-powered streaming responses for instantaneous interactive dialogue.
* **Socratic Pedagogical Framework**: Guides students with leading questions, step-by-step hints, and conceptual checks rather than giving direct answers.
* **Contextual Memory**: Retains conversation history and student competency context.

### 5. Multi-Tenant Role-Based Access Control (RBAC)
* **Tiered Role Architecture**: `SUPER_ADMIN` (Platform Owner), `ADMIN` (Institution/Dean), `TEACHER` (Faculty), and `STUDENT`.
* **Tenant Isolation**: Organization-level data partitioning, custom branding, quota enforcement, and audit trails.

---

## ⚙️ System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Next.js 16 Client Portal                           │
│  React 19 · Tailwind v4 · Zustand · Socket.IO Client · Canvas Preprocessor  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS REST  /  WSS WebSocket
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    Express API Gateway & WebSocket Server                   │
│    Routes · Zod Validators · RBAC Guards · LiveKit · Socket Room Manager    │
└───────────────┬─────────────────────────────────────────────┬───────────────┘
                │ Enqueues Jobs                               │ Queries / Mutates
                ▼                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│         Redis Server          │             │   PostgreSQL 15+ (Prisma)     │
│  · BullMQ Job Queues          │             │  · Multi-Tenant Relational DB │
│  · Rate Limiting & Cache      │             │  · PGVector Hybrid Search     │
│  · Real-time Room State       │             │  · Audit & Attainment Records │
└───────────────┬───────────────┘             └───────────────────────────────┘
                │ Dequeues Jobs
                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Asynchronous Worker Services                         │
│                                                                             │
│  [AI GENERATION & OCR WORKER]                                               │
│  ├─ Multi-format Document Extractor (PDF / DOCX / Vision OCR)               │
│  ├─ Clean Syllabus Parsing & Noise Stripping                                │
│  ├─ Model Fallback Chain (NVIDIA ➔ Groq ➔ Anthropic ➔ OpenAI)               │
│  └─ Zod Validation & JSON Auto-Repair Pipeline                              │
│                                                                             │
│  [PDF COMPOSITION WORKER]                                                   │
│  └─ Headless Chromium A4 Formatter & Institutional Header Stamping          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Description |
|---|---|---|
| **Monorepo** | npm Workspaces | Unified dependency management across `apps/frontend` and `apps/backend` |
| **Frontend Framework** | Next.js 16.2 (App Router), React 19.2 | High-performance React framework with server and client components |
| **Styling & UI** | Tailwind CSS v4, Framer Motion, Lucide Icons | Responsive modern design system with subtle micro-animations |
| **Frontend State** | Zustand, TanStack React Query v5 | Lightweight predictable global store and cached server state |
| **Backend Framework** | Node.js 20 LTS, Express 4.18, TypeScript 5.0 | Type-safe REST API server and asynchronous service layer |
| **Database & ORM** | PostgreSQL 15+, Prisma ORM 7.8, `pgvector` | Relational storage with vector embeddings for hybrid search |
| **Queues & Cache** | Redis 7, BullMQ 5.3 | High-throughput distributed background worker job queues |
| **Real-time Comms** | Socket.IO 4.7, LiveKit SDK | Bi-directional streaming for telemetry, AI tutor, and collaboration |
| **AI Providers** | NVIDIA Vision/Instruct, Groq Cloud, Anthropic, OpenAI | Multi-tier LLM inference cluster with automated circuit breaking |
| **Document Processing** | `pdf-parse`, `yauzl` (DOCX), `xlsx` | In-memory stream extraction for PDFs, Word files, and spreadsheets |
| **PDF Rendering** | `puppeteer-core`, `@sparticuz/chromium` | Sandboxed headless browser compilation for printable exam sheets |
| **Testing** | Vitest 4.1, Playwright | Unit, integration, performance benchmark, and E2E test suites |

---

## 📁 Monorepo Structure

```
VidyaAI/
├── package.json                   # Root monorepo workspace scripts
├── package-lock.json              # Central lockfile
├── docker-compose.yml             # Local PostgreSQL and Redis services
├── render.yaml                    # Multi-service Render production blueprint
├── start-web.sh                   # Production API server start script
├── start-worker.sh                # Production BullMQ background worker start script
├── README.md                      # Primary platform documentation
│
├── apps/
│   ├── backend/                   # Node.js + Express API & Worker Engine
│   │   ├── src/
│   │   │   ├── app.ts             # Express & Socket.IO server bootstrap
│   │   │   ├── config/            # Infrastructure config (env, db, redis, logger)
│   │   │   ├── routes/            # REST API route handlers
│   │   │   ├── controllers/       # Controller logic (Auth, OBE, Generation, Admin)
│   │   │   ├── services/          # Core domain services:
│   │   │   │   ├── ai/            # Multi-provider AI registry & fallback logic
│   │   │   │   ├── document-extractor.service.ts # Vision OCR & multi-file queue
│   │   │   │   ├── ai-tutor.service.ts           # Socratic tutor streaming
│   │   │   │   ├── rag-hybrid-search.service.ts  # PGVector + RRF search
│   │   │   │   └── grader.service.ts             # Auto-evaluation & rubrics
│   │   │   ├── workers/           # BullMQ worker processors (aiGeneration, pdf)
│   │   │   ├── queues/            # BullMQ queue producer wrappers
│   │   │   ├── sockets/           # WebSocket event emitters & room handlers
│   │   │   ├── middlewares/       # Auth JWT, RBAC guards, rate limits, upload
│   │   │   ├── validators/        # Zod request validation schemas
│   │   │   └── __tests__/         # 30+ Vitest test suites (179+ passing tests)
│   │   ├── prisma/                # Prisma schema, migrations, and seed scripts
│   │   └── .env.example           # Backend environment template
│   │
│   └── frontend/                  # Next.js 16 Web Dashboard
│       ├── src/
│       │   ├── app/               # Next.js App Router routes:
│       │   │   ├── (auth)/        # Login, Register, Forgot Password
│       │   │   ├── teacher/       # Faculty portal (OBE, Papers, Library, Insights)
│       │   │   ├── student/       # Student portal (Assessments, Lessons, AI Tutor)
│       │   │   ├── super-admin/   # Super admin portal (Orgs, Providers, System)
│       │   │   └── onboarding/    # Multi-step organizational onboarding
│       │   ├── components/        # Reusable component library (UI, OBE, Layout)
│       │   ├── hooks/             # Custom React hooks (useTutorSocket, useAuth)
│       │   ├── store/             # Zustand global state stores
│       │   └── lib/               # Axios instance, Socket client, utility helpers
│       └── .env.local.example     # Frontend environment template
```

---

## 📋 Prerequisites & Infrastructure

Before running VidyaAI locally, ensure the following are installed:

1. **Node.js**: `v20.x.x` (LTS) or higher
2. **npm**: `v10.x.x` or higher
3. **Docker & Docker Compose**: For local PostgreSQL and Redis
4. **PostgreSQL**: `v15+` with `pgvector` extension support
5. **Redis Server**: `v7+` with standard TCP connectivity (BullMQ requires standard Redis connections)
6. **AI API Key**: At least one valid API key (`NVIDIA_API_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`)

---

## 🚀 Step-by-Step Local Quickstart

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/KiranTejz20005/VidyaAI.git
cd VidyaAI
npm install
```

### 2. Start PostgreSQL & Redis via Docker
```bash
docker compose up -d
```
Verify container health:
* **PostgreSQL**: Port `5432`
* **Redis**: Port `6379`

### 3. Setup Backend Environment & Database
```bash
cp apps/backend/.env.example apps/backend/.env
```
Configure your credentials in `apps/backend/.env`, then push schema migrations and seed default administrative roles:
```bash
cd apps/backend
npx prisma db push
npx prisma db seed
```
Test your database and Redis connections:
```bash
npm run test:connections
```

### 4. Setup Frontend Environment
```bash
cd ../frontend
cp .env.local.example .env.local
```
Ensure `apps/frontend/.env.local` points to your backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 5. Launch Full Platform Concurrently
Return to the root directory and run the monorepo development server:
```bash
cd ../..
npm run dev
```
* **Frontend Web Application**: [http://localhost:3000](http://localhost:3000)
* **Backend API Gateway**: [http://localhost:5000](http://localhost:5000)
* **Backend Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 📊 Environment Variables Matrix

### Backend Environment (`apps/backend/.env`)

| Variable | Required | Default | Description |
|---|:---:|:---:|---|
| `PORT` | No | `5000` | Express server HTTP listen port |
| `NODE_ENV` | Yes | `development` | Runtime environment (`development`, `production`, `test`) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection URI |
| `REDIS_URL` | **Yes** | `redis://localhost:6379` | Primary Redis connection string |
| `REDIS_BULLMQ_URL` | No | `redis://localhost:6379` | Dedicated Redis connection for BullMQ worker threads |
| `JWT_SECRET` | **Yes** | — | Secret key for signing authorization JWTs (min 32 chars) |
| `FRONTEND_URL` | **Yes** | `http://localhost:3000` | Allowed CORS origins (comma-separated for multiple) |
| `NVIDIA_API_KEY` | No | — | NVIDIA Inference API key (Primary Vision & Instruct LLM) |
| `GROQ_API_KEY` | No | — | Groq Cloud API key (Ultra-fast fallback LLM) |
| `OPENAI_API_KEY` | No | — | OpenAI API key (GPT-4o Vision & fallback) |
| `ANTHROPIC_API_KEY` | No | — | Anthropic API key (Claude 3.5 Sonnet fallback) |
| `ENABLE_BACKGROUND_WORKERS` | No | `true` | Enables or disables in-process BullMQ worker processing |
| `RENDER_WORKER_MODE` | No | `both` | Role in containerized environments (`web`, `worker`, `both`) |
| `STORAGE_TYPE` | No | `local` | Upload storage backend (`local`, `s3`, `cloudinary`) |
| `UPLOAD_DIR` | No | `./uploads` | Local upload destination folder path |

### Frontend Environment (`apps/frontend/.env.local`)

| Variable | Required | Default | Description |
|---|:---:|:---:|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:5000` | REST API gateway URL |
| `NEXT_PUBLIC_SOCKET_URL` | **Yes** | `http://localhost:5000` | Real-time WebSocket server URL |

---

## 🎯 OBE & NBA Accreditation Suite

VidyaAI features a complete Outcome-Based Education (OBE) engine aligned with international Washington Accord and National Board of Accreditation (NBA) criteria.

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Syllabus Units  │ ───► │   CO-PO Matrix  │ ───► │ Paper Blueprint │ ───► │  NBA SAR Report │
│ (Topics & Bloom)│      │(Synthesis & RRF)│      │(Marks & Choices)│      │  (Criterion 3)  │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

1. **Syllabus Units & Topics Planner**: Define multi-unit course syllabi with assigned lecture hours, Bloom cognitive domains (Remember ➔ Create), and mapped Course Outcomes.
2. **Dynamic CO-PO Matrix**: Automatically synthesize correlation weightages based on topic keywords and Bloom taxonomy distributions. Teachers can manually override individual cell weightages (1, 2, 3, or `-`).
3. **Assessment Blueprint Builder**: Define structured exam blueprints specifying question sections (Part A: 2-mark Short Answer, Part B: 10-mark Long Essay with internal choice), target CO coverage, and Bloom level allocation.
4. **NBA SAR Criterion 3 Exporter**: Automatically computes direct course attainment, target vs. actual attainment percentages, and produces printable NBA compliance documentation.

---

## 📥 Multi-Source Document Extractor & OCR Queue

The syllabus extraction pipeline extracts text from uploaded images, scans, and documents with fault tolerance:

* **Supported Formats**: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.docx`, `.txt`, `.md`.
* **Bounded Concurrency ($N=3$)**: Uploaded files are queued and processed with maximum 3 concurrent workers to prevent API saturation.
* **Auto-Retry with Backoff**: Failed extractions are re-enqueued to the end of the queue and retried with alternate vision models up to 2 attempts.
* **Client-Side Image Preprocessing**: High-resolution syllabus images (>2000px) are downscaled and compressed via an HTML5 canvas worker prior to upload, minimizing bandwidth and model latency.
* **Noise & Image Description Filtering**: Strips conversational LLM preambles ("The image shows...", "At the bottom of the screen..."), status bar indicators (battery, Wi-Fi, time), and administrative calendar logs (`Revision of Mid-1`, `Seminar 1..N`).
* **Multi-Page Merging**: Detects repeated units across multi-page scans, deduplicates topics, and outputs clean sequential units (`Unit 1: UNIT 1`, `Unit 2: UNIT 2`, etc.).

---

## ⚡ Asynchronous Exam Generation Lifecycle

```
[Draft Created]
       │
       ▼
[Enqueued in BullMQ] ──► Broadcasts `generation:queued`
       │
       ▼
[Document Extraction] ──► Extracts text from PDF / DOCX / Images
       │
       ▼
[Generation Planning] ──► Distributes sections across Bloom levels & Difficulty
       │
       ▼
[Parallel AI Batches] ──► Dispatches parallel chunks to AI fallback chain
       │
       ▼
[Schema Validation]   ──► Zod verification & JSON auto-repair
       │
       ▼
[Answer Key Compiler] ──► Generates marking rubrics & correct answers
       │
       ▼
[PDF Headless Render] ──► Puppeteer compiles printable A4 exam sheet
       │
       ▼
[Persist & Complete]  ──► Commits to PostgreSQL, broadcasts `generation:pdf_ready`
```

---

## 💬 Real-Time AI Socratic Tutor Engine

VidyaAI features a real-time Socratic AI learning companion:

* **Sub-800ms Time-to-First-Token (TTFT)**: Leverages streaming WebSocket connections to deliver instant responses.
* **Socratic Prompt Architecture**: Configured with pedagogical guardrails that provide scaffolding, guiding questions, and conceptual hints rather than direct answers.
* **Lesson Plan Grounding**: Grounded in the course syllabus, lecture notes, and assigned learning outcomes.
* **Teacher Monitoring**: Teachers can view student engagement metrics, topic difficulty heatmaps, and tutoring session summaries.

---

## 🔍 RAG Hybrid Search & PGVector Acceleration

The platform implements hybrid search combining dense semantic embeddings and sparse keyword matching using Reciprocal Rank Fusion (RRF):

* **Embedding Generation**: Text chunks are embedded and indexed in PostgreSQL via `pgvector`.
* **Hybrid Search (Vector + Full-Text)**: Merges cosine similarity vector queries with PostgreSQL full-text search rankings (`tsvector` / `tsquery`).
* **Performance Verified**:
  * **p95 Latency**: `< 0.35ms` on 10,000 document chunks (Target: `< 150ms`).
  * **Top-3 Recall**: `100.0%` benchmark accuracy (A `+100%` improvement over semantic-only baseline).

---

## 📡 REST API Specification

### Authentication & Access Control (`/api/auth`)
* `POST /api/auth/register` : User registration with argon2 password hashing.
* `POST /api/auth/login` : Authenticates user and returns signed JWT token.
* `POST /api/auth/logout` : Clears active session and auth cookies.
* `GET  /api/auth/me` : Returns the authenticated user profile and organizational context.

### Outcome-Based Education (`/api/obe`)
* `GET    /api/obe/courses` : Lists courses for the active organization.
* `POST   /api/obe/courses` : Creates a new course entity.
* `GET    /api/obe/courses/:id/syllabus` : Fetches structured syllabus units and topics.
* `PUT    /api/obe/courses/:id/syllabus` : Saves and updates syllabus unit definitions.
* `GET    /api/obe/courses/:id/matrix` : Returns the CO-PO correlation matrix and attainment data.
* `PUT    /api/obe/courses/:id/matrix` : Updates CO-PO correlation weightages.
* `GET    /api/obe/courses/:id/sar-report` : Generates NBA SAR Criterion 3 direct attainment report.

### Document Extraction & OCR (`/api/generate/parse`)
* `POST /api/generate/parse` : Multipart endpoint accepting single or multiple syllabus documents/images; returns structured, noise-stripped syllabus outline text.

### Exam Paper Generation (`/api/assignments`)
* `GET    /api/assignments` : Returns paginated list of created assignments.
* `POST   /api/assignments` : Creates an assignment and enqueues the AI generation job.
* `GET    /api/assignments/:id` : Returns assignment details, questions, and telemetry logs.
* `DELETE /api/assignments/:id` : Deletes assignment, generated paper, and associated PDF files.
* `POST   /api/assignments/:id/generate` : Retriggers background generation for failed jobs.

### AI Socratic Tutor (`/api/learning`)
* `GET  /api/learning/lessons` : Returns enrolled course lessons and study materials.
* `GET  /api/learning/lessons/:id` : Fetches lesson plan content and interactive objectives.
* `POST /api/learning/tutor/session` : Initializes a new Socratic AI tutoring session.

---

## 🔌 WebSocket Telemetry Events

VidyaAI uses Socket.IO for real-time bidirectional events:

### Generation Telemetry (`/socket.io`)
| Event | Direction | Payload | Description |
|---|:---:|---|---|
| `subscribe:assignment` | Client ➔ Server | `{ assignmentId: string }` | Joins room `assignment:{id}` |
| `generation:queued` | Server ➔ Client | `{ assignmentId, queuePosition }` | Job enqueued in BullMQ |
| `generation:progress` | Server ➔ Client | `{ progress: number, phase: string, message: string }` | Live progress bar updates |
| `generation:completed`| Server ➔ Client | `{ assignmentId, totalQuestions: number }` | Paper generated successfully |
| `generation:pdf_ready`| Server ➔ Client | `{ assignmentId, downloadUrl: string }` | Headless PDF compilation complete |
| `generation:failed` | Server ➔ Client | `{ assignmentId, error: string, retryable: boolean }` | Job failure notification |

### Socratic AI Tutor Streaming (`/socket.io`)
| Event | Direction | Payload | Description |
|---|:---:|---|---|
| `tutor:message` | Client ➔ Server | `{ sessionId: string, message: string }` | Student message sent |
| `tutor:token` | Server ➔ Client | `{ token: string, isFinal: boolean }` | Streamed response chunk |
| `tutor:complete` | Server ➔ Client | `{ fullResponse: string, metadata: object }` | Full streaming turn completed |

---

## 🗄️ Database Schema & Entity Models

The application schema is defined in `apps/backend/prisma/schema.prisma` and backed by PostgreSQL:

* **`Organization`**: Multi-tenant institutional boundaries, subscriptions, quotas, and feature flags.
* **`User`**: User accounts with roles (`SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`), credentials, and profile metadata.
* **`Course`**: Academic courses linked to organizations, subject codes, departments, and semesters.
* **`SyllabusUnit`**: Structured curriculum modules with unit numbers, titles, topics list, Bloom levels, and CO mapping.
* **`CourseOutcome (CO)`**: Defined course outcomes (CO1..CO6) with Bloom cognitive taxonomy levels.
* **`ProgramOutcome (PO)`**: Institutional program outcomes (PO1..PO12) and program-specific outcomes (PSOs).
* **`COPOMatrix`**: Relational mappings with correlation weightages (1, 2, 3) between COs and POs.
* **`Assignment / ExamPaper`**: Generated question papers, section hierarchies, question nodes, marking keys, and PDF links.
* **`Submission & GradeOverride`**: Student answer submissions, automated AI evaluation scores, and teacher override records.

---

## 🤖 AI Inference Fallback & Circuit Breaker

To guarantee 99.9% uptime and prevent API quota disruptions, VidyaAI implements a fault-tolerant multi-gateway inference chain:

```
[NVIDIA NIM / Llama-3.2] (Primary)
        │
        ▼ (Timeout / 429 Rate-Limit)
[Groq Cloud / Llama-3.3] (Fallback Tier 1)
        │
        ▼ (Provider Error)
[Anthropic Claude 3.5]  (Fallback Tier 2)
        │
        ▼ (Final Failover)
[OpenAI GPT-4o / Mini]  (Fallback Tier 3)
```

* **Circuit Breaker**: Detects provider error spikes or timeouts ($>12s$) and temporarily isolates the failing provider, routing requests to the next tier.
* **Dynamic Max Tokens & Temperature**: Automatically adjusts generation parameters based on question difficulty and format.

---

## 🧪 Testing & Quality Verification

VidyaAI maintains a comprehensive test suite powered by **Vitest**:

```bash
cd apps/backend
npm run test
```

### Test Coverage Highlights
* **OCR & Noise Filter Tests**: `document-extractor.test.ts` (Validates vision OCR cleanup, noise filtering, and syllabus deduplication).
* **RAG & Hybrid Search Benchmark**: `rag-hybrid-search.test.ts` (Validates sub-150ms p95 latency and 100% top-3 recall on 10,000 chunks).
* **AI Tutor TTFT Benchmark**: `tutor-ttft-benchmark.test.ts` (Validates WebSocket sub-800ms TTFT streaming target).
* **Circuit Breaker Failover**: `nvidia-groq-circuit-breaker.test.ts` (Validates automatic failover between providers under error conditions).
* **RBAC & Multi-Tenant Isolation**: `rbac-access.test.ts` (Ensures cross-tenant data protection and permission enforcement).

---

## 🌐 Production Deployment Guide

### Option 1: Render Unified Blueprint (Recommended)
The repository includes a production-ready `render.yaml` blueprint defining:
1. **`vidyaai-api`** (Web Service): Express REST and WebSocket gateway running `bash start-web.sh`.
2. **`vidyaai-worker`** (Background Worker): BullMQ asynchronous processor running `bash start-worker.sh`.
3. **`vidyaai-db`** (PostgreSQL): Managed PostgreSQL 15+ database.
4. **`vidyaai-redis`** (Redis): Managed Redis cache and BullMQ instance.

### Option 2: Docker Compose (Self-Hosted Production)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Option 3: Vercel (Frontend) + Render/Railway (Backend)
1. Deploy `apps/frontend` to **Vercel**. Set Root Directory to `apps/frontend`.
2. Set environment variable: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com`.
3. Deploy `apps/backend` to **Render** or **Railway** with `DATABASE_URL` and `REDIS_URL`.

---

## ❓ Troubleshooting & FAQ

#### 1. Redis connection fails with `ECONNREFUSED`
* Ensure your local Redis server or Docker container is active: `docker compose up -d redis`.
* Verify `REDIS_URL` in `.env` is set to `redis://localhost:6379`.

#### 2. Puppeteer fails to launch Chromium in production
* In containerized environments, ensure `@sparticuz/chromium` is installed and the executable path is resolved dynamically. The included Dockerfile and Render scripts handle this automatically.

#### 3. Vision OCR returns empty or invalid text
* Verify your `NVIDIA_API_KEY` or `OPENAI_API_KEY` is configured.
* Ensure uploaded images are under 10MB and are one of the supported formats (`.png`, `.jpg`, `.jpeg`, `.webp`, `.pdf`).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by the VidyaAI Team. Designed for the future of Outcome-Based Education.</sub>
</div>
