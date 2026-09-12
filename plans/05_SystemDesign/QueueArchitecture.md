# Queue architecture
Use durable jobs for OCR, parsing, indexing, batch generation, document export and evaluation. Jobs are idempotent, tenant-tagged, retriable with backoff and dead-lettered after a bounded number of attempts. Never place source text or secrets in logs; use job IDs and protected payload storage.
