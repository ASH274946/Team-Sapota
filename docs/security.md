# VedaAI Security & Access Control

VedaAI enforces granular, multi-tenant security structures to ensure data isolation between institutions and strictly guard user capabilities based on permission mappings.

## 1. Multi-Tenancy Data Isolation

- **Scoped Relations**: Every core business model (Classroom, Section, Assignment, Student, QuestionBank, StudentSubmission, AuditLog) possesses a direct relationship to an `Institution` via `institutionId`.
- **Isolation Checks**: Protected routes use the `requireInstitutionScope()` middleware. This extracts the user's `institutionId` from the JWT and connects it to the request body as `_requireInstitutionScope`. Controllers enforce this scope on all queries.

## 2. Permission-Based Access Control

The platform relies on a permissions matrix mapping roles directly to allowed capabilities. Roles are never hardcoded directly on endpoints; instead, capabilities are checked via `requirePermission()`.

### Permissions Matrix

| Permission | SUPER_ADMIN | ADMIN | TEACHER | STUDENT |
| :--- | :---: | :---: | :---: | :---: |
| `MANAGE_SYSTEM` | Yes | No | No | No |
| `CREATE_ASSIGNMENT` | Yes | No | Yes | No |
| `EDIT_ASSIGNMENT` | Yes | No | Yes | No |
| `DELETE_ASSIGNMENT` | Yes | No | Yes | No |
| `VIEW_ASSIGNMENT` | Yes | Yes | Yes | No |
| `GENERATE_PAPER` | Yes | Yes | Yes | No |
| `VIEW_PAPER` | Yes | Yes | Yes | No |
| `SUBMIT_FOR_APPROVAL`| Yes | No | Yes | No |
| `APPROVE_PAPER` | Yes | Yes | No | No |
| `REJECT_PAPER` | Yes | Yes | No | No |
| `PUBLISH_PAPER` | Yes | Yes | No | No |
| `VIEW_ANALYTICS` | Yes | Yes | Yes | No |
| `MANAGE_USERS` | Yes | Yes | No | No |
| `MANAGE_GROUPS` | Yes | Yes | No | No |
| `VIEW_ROSTER` | Yes | Yes | Yes | No |
| `GRADE_ASSESSMENT` | Yes | No | Yes | No |
| `PUBLISH_RESULTS` | Yes | No | Yes | No |
| `MANAGE_QUESTION_BANK`| Yes | No | Yes | No |
| `MANAGE_SYLLABUS` | Yes | No | Yes | No |
| `VIEW_AUDIT_LOGS` | Yes | Yes | No | No |
| `ATTEMPT_ASSESSMENT` | No | No | No | Yes |
| `SUBMIT_ASSESSMENT` | No | No | No | Yes |
| `VIEW_RESULTS` | No | No | No | Yes |

## 3. Cryptography & Credentials
- **Password Storage**: Passwords are securely hashed using **Argon2** (`argon2` npm library) with default high-security parameters.
- **Access Tokens**: Standard API calls are authenticated using stateless **JWT Access Tokens** containing the user's ID, role, and institution scope.
- **Audit Trails**: Critical mutations insert an entry in the `AuditLog` table containing:
  - `action`: Type of mutation (e.g. `INVITATION_ACCEPTED`, `CSV_IMPORTED`).
  - `userId`: Author of the mutation.
  - `ipAddress` & `userAgent`: Client metadata for threat intelligence.
