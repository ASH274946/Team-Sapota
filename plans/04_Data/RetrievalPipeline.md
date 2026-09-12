# Retrieval pipeline
1. Authorised user requests a course-scoped task.
2. Apply tenant/course/version/classification filters.
3. Run hybrid retrieval and rerank.
4. Check evidence sufficiency and diversity.
5. Send cited context to generation/validation.
6. Store retrieval IDs and scores with the draft.

No cross-tenant fallback and no answer when evidence is missing.
