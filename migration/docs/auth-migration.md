# Auth Migration — VedaAI: Neon → Supabase

## Current State (Preserved As-Is)

The VedaAI platform uses a **fully custom JWT authentication system**. This system is 100% provider-agnostic and continues to work identically with Supabase PostgreSQL.

### Current Auth Architecture

```
User POSTs /api/v1/auth/register or /api/v1/auth/login
         ↓
auth.controller.ts  →  auth.service.ts
         ↓
argon2.hash(password)       # Password hashing
         ↓
prisma.user.create()        # Stored in User table (DATABASE_URL)
         ↓
jsonwebtoken.sign()         # JWT access token (short-lived, 15min)
         ↓
prisma.refreshToken.create() # Refresh token stored in RefreshToken table
         ↓
Set-Cookie: refreshToken (httpOnly)
Response: { accessToken, user }
```

### Tokens & Sessions

| Token | Storage | TTL | Purpose |
|-------|---------|-----|---------|
| Access Token | Response body (memory) | 15 min | API authorization |
| Refresh Token | httpOnly Cookie + DB | 7 days | Token renewal |
| Session | DB (Session table) | 7 days | Active session tracking |

### Auth Middleware

All protected routes use `authenticateToken` middleware which:
1. Extracts Bearer token from `Authorization` header
2. Calls `jwt.verify()` with `JWT_SECRET`
3. Attaches `req.user` to the request
4. Continues to controller

**None of this changes with Supabase.** The entire custom auth system continues to work identically.

---

## What Changed

**Nothing in auth.** The only change is where the database lives (Neon → Supabase), accessed via the same `DATABASE_URL` environment variable and same Prisma queries.

---

## Optional Future Enhancement: Supabase Auth Integration

If you want to optionally add Supabase Auth (e.g., for Google/GitHub OAuth, magic links, or SMS OTP), here is the migration path:

### Phase 1: Parallel Auth (zero breaking changes)
1. Users can still log in with the custom system
2. New users can optionally use Supabase Auth OAuth (Google, GitHub)
3. On Supabase Auth signup, the `handle_new_supabase_user()` trigger creates a matching `User` record
4. Both auth paths work simultaneously

### Phase 2: Supabase Auth as Primary (future)
1. Users authenticate via Supabase (`supabase.auth.signInWithPassword()`)
2. The Supabase JWT is passed to the backend as the Bearer token
3. Backend middleware verifies Supabase JWT using `SUPABASE_JWT_SECRET` instead of `JWT_SECRET`
4. `passwordHash` column becomes optional (or removed)

### Auth Table Mapping (for future reference)

| Current (Custom) | Supabase Auth Equivalent |
|-----------------|--------------------------|
| `User.email + passwordHash` | `auth.users.email + encrypted_password` |
| `Session` table | `auth.sessions` (managed by Supabase) |
| `RefreshToken` table | `auth.refresh_tokens` (managed by Supabase) |
| `PasswordResetToken` table | Supabase `resetPasswordForEmail()` |
| `EmailVerificationToken` | Supabase email confirm flow |
| `LoginHistory` | Supabase audit log |

---

## Current Files (Unchanged)

- [`auth.controller.ts`](../../apps/backend/src/controllers/auth.controller.ts) — Handles register, login, refresh, logout, profile
- [`auth.service.ts`](../../apps/backend/src/services/auth.service.ts) — JWT creation, verification, session management
- [`authenticate.middleware.ts`](../../apps/backend/src/middleware/) — Token verification middleware
- `prisma/schema.prisma` — Session, RefreshToken, PasswordResetToken, EmailVerificationToken tables
