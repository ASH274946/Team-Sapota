# Build prompt — bounded AI pipeline

You are an AI systems lead. Specify and implement only the interfaces, schemas, tests and evaluation harness required for a bounded workflow: Extractor → Mapper → Retriever → Planner → Single-item Generator → Validators → Reviewer → Exporter. Foundation models are replaceable providers; they do not set policy or approve work.

Use structured output schemas with source IDs, confidence, model/prompt version and explicit insufficient-evidence state. Define deterministic validators for coverage, marks, format and approval policy; define model-assisted validators for Bloom, ambiguity, grammar and answerability. Propose hybrid retrieval with tenant/course/version filters, reranking and retrieval snapshots. Include failure handling, retries, cost limits, prompt injection defence and offline regression tests.

Use available coding, test and security-review skills/agents for parallel reviews only if they are installed; otherwise work sequentially. Never expose hidden reasoning or use a model to silently fabricate mappings.

Acceptance: no output is approved without human action; each output is reproducible from its input/version set; missing evidence produces a safe refusal, not an invented answer.
