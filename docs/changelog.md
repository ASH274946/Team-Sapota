# VedaAI Changelog

All notable changes to the VedaAI platform will be documented in this file.

## [2.0.0] - 2026-06-19
### Added
- **Multi-Tenant Architecture**: Introduced `Institution` model and scoped relations (`institutionId`) for global multi-tenancy.
- **Invitation System**: Implemented token-based invite flow, deprecating public self-registration.
- **Classroom Structure**: Created `Classroom`, `Section`, and `Enrollment` models.
- **Audit Trails**: Integrated structured, immutable event logs for key mutations.

### Changed
- **RBAC Refactor**: Migrated from role checks (`requireRole`) to permission checks (`requirePermission`).
- **Workflow Consolidation**: Consolidated state validation and transitions inside `workflowEngine`.

### Removed
- Deprecated legacy `Class` tables and references.
- Unused/duplicate analytics and audit services.
