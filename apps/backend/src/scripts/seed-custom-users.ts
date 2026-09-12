import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑️  Deleting all existing users...');
  // Use TRUNCATE CASCADE to completely wipe users and any linked records (like UserRole, Sessions, etc)
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE public."User" CASCADE;`);
  console.log('✅ Old users deleted.');

  console.log('🌱 Creating requested accounts...');

  const usersToCreate = [
    {
      email: 'superadmin@vidyaai.com',
      password: 'SuperAdmin@123',
      firstName: 'Super',
      lastName: 'Admin',
      dbRole: 'SUPER_ADMIN',
      systemRole: 'SUPER_ADMIN'
    },
    {
      email: 'admin@vidyaai.com',
      password: 'OrgAdmin@123',
      firstName: 'Org',
      lastName: 'Admin',
      dbRole: 'INSTITUTION_ADMIN',
      systemRole: 'ADMIN'
    },
    {
      email: 'faculty@vidyaai.com',
      password: 'Faculty@123',
      firstName: 'Faculty',
      lastName: 'Member',
      dbRole: 'FACULTY',
      systemRole: 'TEACHER'
    },
    {
      email: 'student@vidyaai.com',
      password: 'Student@123',
      firstName: 'Student',
      lastName: 'Learner',
      dbRole: 'STUDENT',
      systemRole: 'STUDENT'
    },
  ];

  // Fetch roles from the DB to link them
  const roles = await prisma.role.findMany();
  const roleMap = roles.reduce((acc, r) => {
    acc[r.name] = r.id;
    return acc;
  }, {} as Record<string, string>);

  for (const u of usersToCreate) {
    const pwdHash = await argon2.hash(u.password);
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: pwdHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.systemRole as any, // "SystemRole" enum fallback
        status: 'ACTIVE',
        hasCompletedOnboarding: ['SUPER_ADMIN', 'ADMIN'].includes(u.systemRole),
        preferences: {
          emailNotifications: true,
        },
      },
    });

    const roleId = roleMap[u.dbRole];
    if (roleId) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleId,
        },
      });
    }
    console.log(`✅ Created ${u.firstName} (${u.email})`);
  }

  console.log('🎉 All custom users created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
