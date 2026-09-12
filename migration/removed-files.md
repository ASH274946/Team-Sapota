# Removed Files Log — VedaAI: Neon → Supabase

## Summary

**Zero files were deleted in this migration.**

This is because the codebase did NOT use `@neondatabase/serverless`, Drizzle ORM, or any Neon-specific SDK. The entire application accessed the database through Prisma ORM with `@prisma/adapter-pg`, which is completely provider-agnostic.

---

## Neon Package Audit (Confirmed Absent)

The following packages were searched for across all `package.json` files and were **NOT found**:

| Package | Found | Notes |
|---------|-------|-------|
| `@neondatabase/serverless` | ❌ Not found | No Neon SDK used |
| `@neondatabase/pg` | ❌ Not found | |
| `neon` | ❌ Not found | |
| `drizzle-orm` | ❌ Not found | No Drizzle ORM |
| `drizzle-kit` | ❌ Not found | |
| `@planetscale/database` | ❌ Not found | |

---

## Files Modified vs Deleted

### Modified (9 files)
- `apps/backend/.env` — DATABASE_URL replaced with Supabase URL template
- `apps/backend/.env.example` — Updated to Supabase format
- `apps/frontend/.env` — Supabase public vars added
- `apps/backend/prisma/seed.ts` — Neon URL fallback removed
- `apps/backend/prisma/seed-superadmin.ts` — Neon URL fallback removed
- `apps/backend/prisma/seed-test-users.ts` — Neon URL fallback removed
- `apps/backend/prisma/seed-test-users.js` — Neon URL fallback removed
- `apps/backend/seed.ts` — Neon URL fallback removed

### Deleted (0 files)
None.

---

## Why No Files Were Deleted

The Neon-specific code surface was limited to:

1. The **connection string URL** in environment variables — which is just a string value change
2. **Hardcoded fallback URLs** in seed scripts — replaced with explicit env-var guards

Since `@prisma/adapter-pg` connects to standard PostgreSQL, and Supabase runs standard PostgreSQL 15+, the migration is entirely a configuration change rather than a code change.
