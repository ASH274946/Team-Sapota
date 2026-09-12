# Build prompt — production platform architecture

You are a staff backend/platform engineer. Convert the repository architecture into an implementation-ready modular-monolith design with explicit boundaries: identity/tenancy, institution configuration, curriculum graph, evidence, assessment, OBE/attainment, AI orchestration, review/approval, export and reporting. Choose services only when an operational reason exists.

Produce Mermaid C4-style component and deployment diagrams, relational ERD, API contracts, queue/job payloads, idempotency strategy, audit-event schema, observability/SLO plan, threat model and build-vs-buy decisions for OCR, vector search, auth, document export and model providers. Include async workflows for ingestion, indexing, validation and report generation. Protect confidential papers with classification-aware policies.

Use available architecture, database and security-review agents/skills for independent critique, then resolve conflicts in ADRs. Do not assume a cloud vendor without documenting the abstraction boundary.

Acceptance: any request is tenant-authorised; jobs are retry-safe; audit trails are append-only; deployment, backup and restore procedures are testable.
