# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-rc.1] - 2026-06-30

### 🚀 Features

**Core AI Infrastructure**
- Fully implemented the `AIOrchestrator` for dynamic LLM routing between NVIDIA NIM and Groq.
- Integrated Hybrid RAG engine (PGVector for semantic search + BM25 for keyword search).
- Added multi-tenant Document Ingestion Pipeline with automatic OCR and Semantic Chunking.
- Established a persistent Knowledge Base for context grounding.

**Student Workspace**
- Complete Student Dashboard visualizing Learning Profiles, Mastery Scores, and Learning Velocity.
- Interactive AI-generated Study Plans with dynamic tasks.
- Socratic AI Tutor with real-time chat, streaming responses, and RAG citations.
- Complete Adaptive Quiz Engine and Question Paper Intelligence Engine.
- Assignment submission viewer and gradebook tracking.

**Teacher Workspace**
- Teacher AI Copilot for autonomous lesson planning and academic workflow automation.
- Class Insights dashboard providing proactive interventions for at-risk students and identifying weak topics.
- Comprehensive Rubric Intelligence engine and AI Grading system (with confidence scores and teacher overrides).
- Knowledge Quality and RAG Optimization management.

**Enterprise Admin Platform**
- High-level Command Center for Organizations, Departments, and System Usage.
- System Health dashboard monitoring CPU, Memory, PostgreSQL, Redis, and BullMQ active/DLQ queues.
- AI Provider dashboard tracking NVIDIA NIM and Groq API latency, usage, and estimated costs.
- Complete Role-Based Access Control (RBAC) mapping across Global and Organization contexts.

### 🛡️ Security & Performance
- Full Multi-Tenant data isolation via Prisma schema boundaries.
- Protected API routes using unified JWT authentication guards.
- BullMQ asynchronous worker implementation for high-latency tasks (OCR, chunking, heavy AI generation).
- TanStack Query implementation on the frontend for optimistic updates and request deduplication.

### 🐛 Known Issues & Limitations
- **PDF Export**: The lesson planner PDF export is currently a mock action and requires backend PDF rendering implementation.
- **WebSocket Streaming**: Streaming responses currently use basic polling or long-lived HTTP responses. Full WebSocket/SSE integration is planned for 1.1.
- **Provider Fallback**: If NVIDIA NIM experiences a hard timeout > 30s, the Groq fallback may experience a delayed response on the client.

### 📦 Deployment
- Verified `docker-compose.prod.yml` configuration.
- Completed GitHub Actions CI/CD pipeline for ESLint, TypeScript Type Checks, and Jest tests.
