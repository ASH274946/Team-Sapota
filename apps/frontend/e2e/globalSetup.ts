import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global setup: authenticate each seeded role through the real UI and persist a
 * storageState (cookies + localStorage) so individual specs can reuse sessions
 * without re-logging-in. The seeded users come from
 * `apps/backend/prisma/seed-test-users.ts`.
 *
 * Credentials (from prisma/seed-test-users.ts):
 *   student@vidyaai.com   / Student@123   (STUDENT  -> /dashboard/student)
 *   faculty@vidyaai.com   / Faculty@123   (TEACHER  -> /dashboard/faculty)
 *   admin@vidyaai.com     / OrgAdmin@123  (ADMIN    -> /dashboard/admin)
 *   superadmin@vidyaai.com/ SuperAdmin@123 (SUPER_ADMIN -> /super-admin)
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const AUTH_DIR = path.resolve(__dirname, '.auth');

type Role = {
  name: string;
  email: string;
  password: string;
  dashboardPath: string;
};

const ROLES: Role[] = [
  { name: 'student', email: 'student@vidyaai.com', password: process.env.E2E_STUDENT_PASSWORD || 'Student@123', dashboardPath: '/dashboard/student' },
  { name: 'teacher', email: 'faculty@vidyaai.com', password: process.env.E2E_TEACHER_PASSWORD || 'Faculty@123', dashboardPath: '/dashboard/faculty' },
  { name: 'admin', email: 'admin@vidyaai.com', password: process.env.E2E_ADMIN_PASSWORD || 'OrgAdmin@123', dashboardPath: '/dashboard/admin' },
];

async function loginAndSaveState(role: Role) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/login');
  await page.fill('input[placeholder="Email"]', role.email);
  await page.fill('input[placeholder="Password"]', role.password);
  await page.click('button:has-text("Sign in")');

  // Wait until we are redirected to the role-specific dashboard.
  await page.waitForURL(`**${role.dashboardPath}**`, { timeout: 30_000 });

  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
  const statePath = path.join(AUTH_DIR, `${role.name}.json`);
  await context.storageState({ path: statePath });
  console.log(`[globalSetup] Saved auth state for ${role.name} -> ${statePath}`);

  await context.close();
  await browser.close();
}

async function globalSetup(_config: FullConfig) {
  for (const role of ROLES) {
    await loginAndSaveState(role);
  }
}

export default globalSetup;
