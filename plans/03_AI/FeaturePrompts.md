# 03 AI Feature Prompts

Use these prompts to define the AI layer, its safety rails, and its architecture.

## AIArchitecture.md

Design the AI system as a set of grounded services, not a monolithic prompt. Explain how retrieval, policy checks, structured generation, validation, and review fit together.

Requirements:

- Include the trust boundaries.
- Explain where the system must stay deterministic.
- Keep institutional safety and auditability first.

## RAGArchitecture.md

Design the retrieval layer for academic knowledge, policies, and evidence. Explain indexing, chunking, ranking, citation, and source attribution.

Requirements:

- Support multiple content types.
- Preserve provenance.
- Optimize for correctness over creativity.

## KnowledgeGraph.md

Describe the academic knowledge graph, its nodes, edges, and how it powers planning and validation. Include institutions, courses, outcomes, assessments, evidence, and regulations.

Requirements:

- Show the graph's role in retrieval and reasoning.
- Explain how it supports OBE and accreditation workflows.
- Keep the schema stable enough for long-term use.

## PromptEngineering.md

Define the prompt strategy for all system tasks. Include prompt templates, role boundaries, allowed output formats, refusal conditions, and grounding rules.

Requirements:

- Make prompts reusable and auditable.
- Separate user-facing prompts from system prompts.
- Include examples of structured outputs.

## EvaluationPipeline.md

Design a full evaluation process for AI outputs. Include correctness, groundedness, completeness, institutional compliance, and human review loops.

Requirements:

- Define both offline and production checks.
- Include regression testing for prompt changes.
- Show what happens when outputs fail.

## AgentArchitecture.md

Define how agents cooperate in the system. Describe task boundaries, orchestration, escalation, and how agents hand work to humans when confidence is low.

Requirements:

- Keep agent responsibilities narrow.
- Prevent uncontrolled generation.
- Make the orchestration observable.

## ModelSelection.md

Create a decision framework for choosing models based on task class, latency, cost, safety, and reasoning depth.

Requirements:

- Compare models by job to be done.
- Explain fallback strategy.
- Keep vendor lock-in in mind.

## FineTuningStrategy.md

Describe if, when, and how fine-tuning should be used. Include the data needed, the risks, the expected gain, and what should stay in retrieval or prompting instead.

Requirements:

- Avoid premature fine-tuning.
- Explain why a given task needs tuning.
- Include evaluation criteria before and after tuning.
