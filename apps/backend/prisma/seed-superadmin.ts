import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Set it to your Supabase connection string.');
}
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'superadmin@vidyaai.com' } });
  if (existing) {
    console.log('Super admin already exists:');
    console.log('  Email:    superadmin@vidyaai.com');
    console.log('  Password: SuperAdmin@123');
    console.log('  ID:       ' + existing.id);
    return;
  }

  let org = await prisma.organization.findFirst({ where: { code: 'VIDYA' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'VidyaAI Platform',
        code: 'VIDYA',
        email: 'admin@vidyaai.com',
        status: 'ACTIVE',
      },
    });
    console.log('Organization created:', org.id);
  }

  const pwdHash = await argon2.hash('SuperAdmin@123');
  const user = await prisma.user.create({
    data: {
      email: 'superadmin@vidyaai.com',
      passwordHash: pwdHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      hasCompletedOnboarding: true,
      onboardingCompletedAt: new Date(),
      organizationId: org.id,
    },
  });

  console.log('SUPER_ADMIN created successfully!');
  console.log('');
  console.log('  Email:    superadmin@vidyaai.com');
  console.log('  Password: SuperAdmin@123');
  console.log('  ID:       ' + user.id);
  console.log('  Role:     SUPER_ADMIN');
  console.log('');
  console.log('Login at http://localhost:3000/login');
}

main().catch(console.error).finally(() => prisma.$disconnect());
