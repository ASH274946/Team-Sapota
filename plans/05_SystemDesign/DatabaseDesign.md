# Database design
Use a relational primary store for tenants, users, roles, courses, documents, outcomes, blueprints, items, reviews, approvals and immutable audit events. Enforce tenant ID at every table and query. Use object storage for originals and a vector/search store for chunks. Version mutable educational artefacts rather than overwriting them.
