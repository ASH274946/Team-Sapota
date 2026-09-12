# Build prompt — engineering execution plan

Act as an engineering manager. Turn approved specifications into small, independently testable vertical slices. Start with authentication/tenancy, source ingestion, mapping review, graph persistence, retrieval, blueprint planning, one-item draft/validation, approval and export. For each slice write issue-ready tasks, dependencies, API/schema migrations, test plan, telemetry, rollback and definition of done.

Use coding agents only for bounded implementation tasks after giving each a file scope, contract, tests and non-goals. Require a reviewer agent to inspect security, tenant isolation and backward compatibility. Reuse existing repository conventions; do not rewrite unrelated files. Run unit, integration and end-to-end tests and report results honestly.

Acceptance: each slice ships behind a feature flag, has audit events, has happy/failure-path tests and is demonstrable with synthetic tenant data.
