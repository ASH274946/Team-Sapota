# CI/CD Architecture Documentation

This document describes the enterprise-grade Continuous Integration and Continuous Deployment (CI/CD) pipelines for the Enterprise AI Academic Operating System.

## 1. Branching Strategy & Protection
- **`main`**: The production branch. Direct commits are prohibited.
- **`staging`**: The pre-production integration branch.
- **Pull Requests**: Every PR targeting `main` or `staging` must successfully pass the `CI Pipeline` and `Security Scan` before merging is allowed.

## 2. GitHub Actions Workflows
Located in `.github/workflows/`:

### A. CI Pipeline (`ci-pipeline.yml`)
- **Trigger**: Pull Requests to `main` or `staging`.
- **Jobs**:
  1. **Validate Codebase**: Installs dependencies, runs ESLint, generates Prisma client, runs TypeScript compiler (`npm run build`), and executes Unit Tests.
  2. **Security & Vulnerability Scan**: Runs `npm audit --audit-level=high`.
  3. **Verify Docker Builds**: Dry-runs the multi-stage Docker builds to ensure production images compile successfully without syntax or dependency errors.
- **Failure Condition**: Any failed step immediately aborts the pipeline and blocks the PR.

### B. CD Pipeline (`cd-pipeline.yml`)
- **Trigger**: Push (merge) to `main`.
- **Jobs**:
  1. **Build & Publish**: Re-verifies secrets, builds the production `vidyaai-backend` and `vidyaai-frontend` Docker images, tags them with the Git SHA, and pushes them to the remote container registry.
  2. **Execute Production Rollout**:
     - Runs `npx prisma migrate deploy` safely against the production database.
     - Triggers the rolling update on the production cluster (e.g., via `kubectl set image`).
     - Verifies application liveness via the `/health` endpoint before marking deployment successful.

### C. Release Management (`release-management.yml`)
- **Trigger**: Push to `main`.
- **Action**: Automatically generates a GitHub Release, parses commit messages into a `CHANGELOG`, and tags the repository.

### D. Security & Secret Scanning (`security-scan.yml`)
- **Trigger**: Push, PR, and Scheduled (Weekly).
- **Action**: Uses Gitleaks to scan for accidentally committed secrets/tokens and executes CodeQL for Static Application Security Testing (SAST).

### E. Rollback (`rollback.yml`)
- **Trigger**: Manual Workflow Dispatch.
- **Action**: Allows authorized admins to quickly revert the production deployment to a specific Git SHA in case of a critical post-deployment failure.

## 3. Docker Optimization
The repository uses Multi-Stage Docker builds to minimize final image size:
- **Builder Stage**: Copies the monorepo workspace, installs all `devDependencies`, generates Prisma, and runs the build command.
- **Runner Stage**: Copies only the compiled output (`dist` or `.next/standalone`), installs production-only dependencies (`npm ci --omit=dev`), and runs the process under an unprivileged non-root user (`appuser` or `nextjs`).

## 4. Required Secrets
The following secrets must be injected into the GitHub Repository settings for the CD pipeline to function:
- `DATABASE_URL`: Production PostgreSQL connection string.
- `JWT_SECRET`: Secure cryptographic signing key.
- *Cloud Provider Credentials* (e.g., AWS Access Keys or GCP Service Accounts).

*(See `.env.example` for the complete list of runtime environment variables).*
