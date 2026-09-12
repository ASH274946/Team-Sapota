# Build prompt — institutional data and knowledge graph

Act as data architect and privacy engineer. Design the tenant-isolated ingestion pipeline for syllabus, regulations, CO/PO/PSO mappings, templates, historical papers, rubrics and evidence. Produce concrete JSON/SQL schemas, lifecycle states, object naming rules, metadata contract, OCR/extraction quality gates, chunking rules and graph edge definitions.

Every raw and derived record needs tenant, source/version, owner, rights status, classification, purpose and retention metadata. Create a Mermaid ERD and a provenance sequence diagram. Specify deletion propagation across object storage, relational records, vectors, caches and backups. Separate approved content from candidate extracted content. Do not use customer confidential material for model training by default.

Use available security/privacy skills or agents for a review, but leave legal conclusions to counsel. Include test fixtures using synthetic data only.

Acceptance: cross-tenant retrieval is impossible by design; every graph assertion is either source-backed or faculty-approved; every export can cite its source versions.
