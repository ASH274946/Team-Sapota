# 05 System Design Feature Prompts

Use these prompts to turn the product into a system architecture.

## HighLevelArchitecture.md

Create the top-level system design and show how the product, AI layer, data layer, and institutional integrations connect.

Requirements:

- Include major services and trust boundaries.
- Show how requests flow through the system.
- Keep the architecture implementable by a small team.

## Microservices.md

Define the service decomposition. Explain which boundaries exist, why they exist, and which services should not be split too early.

Requirements:

- Keep service ownership clear.
- Avoid unnecessary fragmentation.
- Show the core contracts between services.

## QueueArchitecture.md

Design the asynchronous layer for ingestion, processing, evaluation, notifications, and report generation.

Requirements:

- Show retries, idempotency, and dead-letter handling.
- Explain what must be synchronous versus async.
- Keep the queue model simple enough to operate.

## DatabaseDesign.md

Design the data model for institutional records, academic knowledge, versioning, approvals, and outputs.

Requirements:

- Identify core entities and relationships.
- Show which data is transactional and which is analytical.
- Include audit and history requirements.

## Storage.md

Define how raw files, generated artifacts, citations, and reports are stored and secured.

Requirements:

- Separate source data from outputs.
- Address retention and access controls.
- Keep file naming and retrieval simple.

## Scaling.md

Describe how the system scales by institution size, document volume, user load, and AI usage.

Requirements:

- Include bottlenecks and mitigations.
- Explain scaling priorities in order.
- Tie scaling decisions to cost control.
