# 06 Implementation Feature Prompts

Use these prompts when turning the design into working software.

## BackendChecklist.md

Create the backend delivery checklist for APIs, auth, workflows, retrieval, validation, and audit logs.

Requirements:

- Break work into implementable chunks.
- Mark each item by dependency and risk.
- Keep the checklist production-oriented.

## FrontendChecklist.md

Create the frontend delivery checklist for the institution dashboard, workflow screens, review screens, and admin controls.

Requirements:

- Focus on clarity and trust.
- Include role-based screens.
- Keep the interaction model simple for faculty.

## AIChecklist.md

Create the AI implementation checklist for prompts, grounding, evaluation, safety, and fallback behavior.

Requirements:

- Tie each step to a measurable quality gate.
- Include human review where needed.
- Keep model behavior predictable.

## DevOpsChecklist.md

Create the deployment checklist for environments, secrets, observability, backups, release flow, and rollback.

Requirements:

- Include release safety controls.
- Mention monitoring and alerting.
- Keep the deployment path repeatable.

## SecurityChecklist.md

Create the security checklist for data access, tenant isolation, encryption, permissions, auditability, and incident response.

Requirements:

- Protect institutional data first.
- Call out compliance-sensitive areas.
- Make the checklist actionable, not abstract.

## AgentOrchestration.md

Define the standard operating protocol for all Claude Code or OpenCode agents working in this repository. Each agent should receive the folder goal, the specific file to produce, the acceptance criteria, and the allowed scope.

Requirements:

- Assign one agent per bounded task.
- Require a handoff note when the task finishes.
- Escalate only when a decision would change the product direction.
- Treat `BuildPrompt.md` as the folder-level coordinator and `FeaturePrompts.md` as the per-file execution map.

## Execution rule

When implementing, always start from the prompt pack for the folder you are changing, then open the feature file you are editing, then write the output, then verify it against the acceptance criteria.
