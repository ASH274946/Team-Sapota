# VedaAI API Reference

This document maps out the core endpoints exposed by the backend API.

## 1. Authentication (`/api/auth`)
- `POST /login` - User authentication. Returns JWT access token.
- `POST /accept-invite` - Completes account activation for invited users.

## 2. Super Admin (`/api/super-admin`)
- `POST /institutions` - Create a new tenant institution (`MANAGE_SYSTEM` permission).
- `GET /institutions` - List institutions (`MANAGE_SYSTEM` permission).
- `POST /institutions/:id/assign-admin` - Assign an administrator.

## 3. Institution Admin (`/api/admin`)
- `GET /users` - List all institutional users (`MANAGE_USERS` permission).
- `POST /users/invite` - Generate invitation link (`MANAGE_USERS` permission).
- `POST /users/import` - Bulk upload users via CSV (`MANAGE_USERS` permission).

## 4. Assignments & Reviews (`/api/assignments`)
- `GET /` - List all active assignments (`VIEW_ASSIGNMENT` permission).
- `POST /` - Create a new assignment specification (`CREATE_ASSIGNMENT` permission).
- `POST /:id/generate` - Queue AI generation job (`GENERATE_PAPER` permission).
- `POST /:id/submit` - Submit generated exam for approval (`SUBMIT_FOR_APPROVAL` permission).
- `POST /:id/approve` - Approve generated paper (`APPROVE_PAPER` permission).
- `POST /:id/reject` - Reject paper with comments (`REJECT_PAPER` permission).
