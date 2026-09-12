# Agent orchestration protocol for OpenCode / Claude Code

1. Start by reading `README.md`, the relevant folder’s `BuildPrompt.md`, ADRs and adjacent contracts.
2. Inspect available agents, skills and tools; use only those actually available. Never claim an unavailable agent reviewed work.
3. Plan one vertical slice. Delegate only independent bounded work: schema review, UX critique, security review or test generation.
4. Give each delegate a file scope, inputs, expected output, constraints and acceptance tests. One agent owns integration.
5. Preserve human decision points: no agent may publish artefacts, send data externally, alter source records or bypass approval controls.
6. Run tests after integration. Record changed files, decisions, test results, open risks and rollback steps in the PR/task summary.

Use this standard task envelope:

```text
Read <relevant docs>. Implement <one bounded slice> only.
Contracts: <schemas/APIs>. Non-goals: <explicit exclusions>.
Security: enforce tenant isolation, audit events and source classification.
Tests: add happy path, invalid input, cross-tenant denial and retry/idempotency coverage.
Return: changed files, commands/tests run, results, risks and ADR proposals.
```
