# Migration Test Plan — VedaAI: Neon → Supabase

## Pre-Migration Checklist

- [ ] Supabase project created and credentials noted
- [ ] Supabase connection string updated in `apps/backend/.env`
- [ ] `02_supabase_schema.sql` executed in Supabase SQL Editor (no errors)
- [ ] `03_rls_policies.sql` executed (no errors)
- [ ] `04_auth_triggers.sql` executed (no errors)
- [ ] `05_indexes.sql` executed (no errors)
- [ ] `npx prisma generate` run successfully after updating DATABASE_URL
- [ ] `npx prisma db push` (for fresh DB) OR data migration script run

---

## Test Suite

### 1. Infrastructure / Connectivity

| Test | Command | Expected |
|------|---------|---------|
| Backend starts | `npm run dev --workspace=apps/backend` | No connection errors in logs |
| Health check | `GET http://localhost:3001/health` | `{ status: "ok", db: "prisma-postgresql" }` |
| Prisma introspect | `npx prisma db pull` | Schema matches `schema.prisma` |

### 2. Auth Endpoints

| Test | Method | Endpoint | Expected |
|------|--------|---------|---------|
| Register new user | POST | `/api/v1/auth/register` | 201 `{ user, accessToken }` + cookie |
| Login | POST | `/api/v1/auth/login` | 200 `{ user, accessToken }` + cookie |
| Get profile | GET | `/api/v1/auth/me` | 200 `{ user }` |
| Refresh token | POST | `/api/v1/auth/refresh` | 200 `{ accessToken }` |
| Logout | POST | `/api/v1/auth/logout` | 200, cookie cleared |
| Duplicate email | POST | `/api/v1/auth/register` | 409 Conflict |
| Wrong password | POST | `/api/v1/auth/login` | 401 Unauthorized |

### 3. Organization & Multi-tenancy

| Test | Expected |
|------|---------|
| Create org (SUPER_ADMIN) | 201, org created |
| List org users (ADMIN) | 200, users array |
| Cross-org data isolation | User from Org A cannot see Org B data |
| Super admin sees all orgs | 200, all orgs listed |

### 4. Assignment Generation (Core Feature)

| Test | Expected |
|------|---------|
| Create assignment | 201, assignment with DRAFT status |
| Trigger generation | 202, GenerationJob created with `queued` status |
| Socket.IO progress update | Client receives `generation:progress` events |
| Generation completes | GenerationJob status = `completed`, GeneratedPaper created |
| Download PDF | 200, PDF binary response |
| Re-generate (bump generationSeq) | Old job cancelled, new job created |

### 5. Question Bank

| Test | Expected |
|------|---------|
| Create question | 201 |
| List by difficulty | 200, filtered correctly |
| List by bloom level | 200, filtered correctly |
| Search by subject+topic | 200, relevant questions |
| Tag filter (GIN index) | 200, correct tag-filtered results |

### 6. Grading

| Test | Expected |
|------|---------|
| Submit student submission | 201 |
| AI grade submission | 200, SubmissionEvaluation created |
| Teacher override grade | 200, updated |
| Student views own result | 200 |
| Student cannot view others' results | 403 |

### 7. Real-time (Socket.IO — Unchanged)

| Test | Expected |
|------|---------|
| Connect to socket | WebSocket connection established |
| Subscribe to assignment room | `subscribe:assignment` joins room |
| Generation progress event | `generation:progress` received during generation |
| Disconnect and reconnect | Resubscription works |

### 8. Notifications

| Test | Expected |
|------|---------|
| Assignment published notification | Created in DB automatically (via trigger) |
| Generation complete notification | Created in DB automatically (via trigger) |
| Mark notification as read | `isRead` = true |
| Unread count query | Correct count from partial index |

### 9. Seeding

| Test | Command | Expected |
|------|---------|---------|
| Seed test users | `npx ts-node prisma/seed-test-users.ts` | All 4 users created |
| Login with seeded user | POST `/api/v1/auth/login` | 200 |
| Seed super admin | `npx ts-node prisma/seed-superadmin.ts` | Super admin created |

### 10. Admin Panel

| Test | Expected |
|------|---------|
| SUPER_ADMIN: list all orgs | 200 |
| SUPER_ADMIN: list all users | 200 |
| SUPER_ADMIN: suspend org | Status updated |
| ADMIN: list org users | 200, only same-org users |
| TEACHER: cannot access admin routes | 403 |

---

## Performance Validation

Run these queries in Supabase SQL Editor after migration to validate indexes:

```sql
-- 1. Assignment listing (most common query)
EXPLAIN ANALYZE
SELECT * FROM "Assignment"
WHERE "organizationId" = 'your-org-id'
AND "status" IN ('DRAFT', 'GENERATED', 'APPROVED')
ORDER BY "createdAt" DESC
LIMIT 20;
-- Expected: Index Scan on Assignment_org_status_createdAt_idx, < 5ms

-- 2. Question bank search
EXPLAIN ANALYZE
SELECT * FROM "QuestionBank"
WHERE "organizationId" = 'your-org-id'
AND "subject" = 'Mathematics'
AND "difficulty" = 'MEDIUM'
AND "isActive" = TRUE
LIMIT 50;
-- Expected: Index Scan on QuestionBank_active_idx, < 5ms

-- 3. Notification unread count
EXPLAIN ANALYZE
SELECT COUNT(*) FROM "Notification"
WHERE "userId" = 'your-user-id'
AND "isRead" = FALSE;
-- Expected: Index Only Scan on Notification_userId_unread_idx, < 1ms

-- 4. Active generation job lookup
EXPLAIN ANALYZE
SELECT * FROM "GenerationJob"
WHERE "assignmentId" = 'your-assignment-id'
AND "status" NOT IN ('completed', 'failed', 'cancelled')
ORDER BY "generationSeq" DESC
LIMIT 1;
-- Expected: Index Scan on GenerationJob_active_jobs_idx, < 2ms
```

---

## Rollback Plan

If the migration needs to be reversed:

1. Set `DATABASE_URL` back to the Neon connection string in `apps/backend/.env`
2. Restore the Neon URL fallbacks in seed files (or use env var)
3. Restart the backend — no code changes needed
4. Neon data remains intact (Neon has a 30-day data retention)

**Note:** The rollback window depends on how much new data has been written to Supabase that isn't in Neon. If there's new production data in Supabase, you'd need to sync it back to Neon before reverting.

---

## Smoke Test Commands

```bash
# 1. Start backend with Supabase DATABASE_URL
cd apps/backend && npm run dev

# 2. Test health
curl http://localhost:3001/health

# 3. Register test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234","firstName":"Test","lastName":"User"}'

# 4. Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'

# 5. Use the returned accessToken for authenticated requests
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
