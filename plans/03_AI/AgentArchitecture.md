# Agent architecture
Prefer a bounded workflow over free-form agents. Specialist steps may extract, retrieve, draft, validate and format; each receives typed inputs and limited tools. A policy engine enforces tenant boundaries, allowed sources and human approval. No agent may publish, email, alter source material or access another tenant.
