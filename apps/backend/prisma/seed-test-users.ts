import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Set it to your Supabase connection string.');
}
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function upsertUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  organizationId?: string;
  departmentId?: string;
  hasCompletedOnboarding?: boolean;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    console.log(`  ✓ Already exists: ${data.email} (${data.role})`);
    return existing;
  }

  const pwdHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: pwdHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      organizationId: data.organizationId,
      departmentId: data.departmentId,
      hasCompletedOnboarding: data.hasCompletedOnboarding ?? true,
      onboardingCompletedAt: new Date(),
      status: 'ACTIVE',
      preferences: {
        emailNotifications: true,
        inAppAlerts: true,
        autoSave: true,
      },
    },
  });

  console.log(`  ✓ Created: ${data.email} (${data.role})`);
  return user;
}

async function main() {
  console.log('\n🌱  Seeding test users for VidyaAI Platform...\n');

  // ── 1. Ensure the VidyaAI Platform organization exists ──
  let org = await prisma.organization.findFirst({ where: { code: 'VIDYA' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'VidyaAI Platform',
        code: 'VIDYA',
        email: 'platform@vidyaai.com',
        status: 'ACTIVE',
        subscriptionPlan: 'PRO',
      },
    });
    console.log('  ✓ Organization created: VidyaAI Platform (VIDYA)');
  } else {
    console.log('  ✓ Organization found: VidyaAI Platform (VIDYA)');
  }

  // ── 2. Ensure a demo department exists inside the org ──
  let dept = await prisma.department.findFirst({
    where: { organizationId: org.id, name: 'Computer Science' },
  });
  if (!dept) {
    dept = await prisma.department.create({
      data: {
        name: 'Computer Science',
        code: 'CS',
        organizationId: org.id,
        status: 'ACTIVE',
      },
    });
    console.log('  ✓ Department created: Computer Science');
  } else {
    console.log('  ✓ Department found: Computer Science');
  }

  // ── 3. Super Admin ──
  console.log('\n[SUPER ADMIN]');
  await upsertUser({
    email: 'superadmin@vidyaai.com',
    password: 'SuperAdmin@123',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    organizationId: org.id,
    hasCompletedOnboarding: true,
  });

  // ── 4. Org Admin (ADMIN role) ──
  console.log('\n[ORG ADMIN]');
  await upsertUser({
    email: 'admin@vidyaai.com',
    password: 'OrgAdmin@123',
    firstName: 'Org',
    lastName: 'Admin',
    role: 'ADMIN',
    organizationId: org.id,
    hasCompletedOnboarding: true,
  });

  // ── 5. Faculty / Teacher ──
  console.log('\n[FACULTY / TEACHER]');
  await upsertUser({
    email: 'faculty@vidyaai.com',
    password: 'Faculty@123',
    firstName: 'Priya',
    lastName: 'Sharma',
    role: 'TEACHER',
    organizationId: org.id,
    departmentId: dept.id,
    hasCompletedOnboarding: true,
  });

  // ── 6. Student ──
  console.log('\n[STUDENT]');
  await upsertUser({
    email: 'student@vidyaai.com',
    password: 'Student@123',
    firstName: 'Rahul',
    lastName: 'Verma',
    role: 'STUDENT',
    organizationId: org.id,
    departmentId: dept.id,
    hasCompletedOnboarding: true,
  });

  // ── Summary ──
  console.log('\n' + '═'.repeat(55));
  console.log('  ✅  Test users ready! Use these credentials:\n');
  console.log('  ROLE          EMAIL                     PASSWORD');
  console.log('  ─────────────────────────────────────────────────');
  console.log('  Super Admin   superadmin@vidyaai.com     SuperAdmin@123');
  console.log('  Org Admin     admin@vidyaai.com          OrgAdmin@123');
  console.log('  Faculty       faculty@vidyaai.com        Faculty@123');
  console.log('  Student       student@vidyaai.com        Student@123');
  console.log('═'.repeat(55));
  console.log('\n  Login URL: http://localhost:3000/login\n');
}

main()
  .catch((e) => {
    console.error('\n❌  Seeding error:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
