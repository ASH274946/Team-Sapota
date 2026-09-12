import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const USER_ID = 'demo-faculty-id';

async function main() {
  console.log('🌱 Seeding system events...');

  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'VidyaAI Demo School',
        slug: 'vidyaai-demo',
        code: 'VAI123',
      }
    });
  }
  const INST_ID = org.id;

  // Create some users to associate events with if they don't exist
  const superAdmin = await prisma.user.upsert({
    where: { email: 'super@vidyaai.com' },
    update: {},
    create: {
      email: 'super@vidyaai.com',
      passwordHash: 'hash',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    }
  });

  const orgAdmin = await prisma.user.upsert({
    where: { email: 'admin@vidyaai.demo' },
    update: {},
    create: {
      email: 'admin@vidyaai.demo',
      passwordHash: 'hash',
      firstName: 'Org',
      lastName: 'Admin',
      role: 'ADMIN',
      organizationId: INST_ID
    }
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@vidyaai.demo' },
    update: {},
    create: {
      email: 'student@vidyaai.demo',
      passwordHash: 'hash',
      firstName: 'Demo',
      lastName: 'Student',
      role: 'STUDENT',
      organizationId: INST_ID
    }
  });

  const faculty = await prisma.user.upsert({
    where: { id: USER_ID },
    update: {},
    create: {
      id: USER_ID,
      email: 'demo@bloomverify.com',
      passwordHash: 'demo-hash-not-real',
      firstName: 'Demo',
      lastName: 'Faculty',
      role: 'TEACHER',
      organizationId: INST_ID,
    },
  });

  const eventsToCreate = [
    {
      userId: student.id,
      organizationId: INST_ID,
      action: 'STUDENT_ATTENDED_QUIZ',
      details: { quizId: 'q-123', score: 85 },
      createdAt: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
    },
    {
      userId: student.id,
      organizationId: INST_ID,
      action: 'STUDENT_ATTENDED_PRACTICE_TEST',
      details: { testId: 'pt-456', duration: '45m' },
      createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
    },
    {
      userId: faculty.id,
      organizationId: INST_ID,
      action: 'FACULTY_CREATED_QUESTION_PAPER',
      details: { subject: 'Mathematics', class: 'Class 10' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
    {
      userId: superAdmin.id,
      action: 'SUPER_ADMIN_UPDATED_SETTINGS',
      details: { setting: 'Global Features', enabled: true },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
    },
    {
      userId: orgAdmin.id,
      organizationId: INST_ID,
      action: 'ORG_ADMIN_ADDED_DEPARTMENT',
      details: { departmentName: 'Science Lab' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) // 5 hours ago
    },
    {
      userId: faculty.id,
      organizationId: INST_ID,
      action: 'FACULTY_GRADED_ASSIGNMENT',
      details: { assignmentId: 'a-789' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
    },
    {
      userId: student.id,
      organizationId: INST_ID,
      action: 'STUDENT_SUBMITTED_ASSIGNMENT',
      details: { assignmentId: 'a-789' },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25) // 25 hours ago
    }
  ];

  for (const event of eventsToCreate) {
    await prisma.auditLog.create({
      data: {
        user: event.userId ? { connect: { id: event.userId } } : undefined,
        organization: event.organizationId ? { connect: { id: event.organizationId } } : undefined,
        action: event.action,
        metadata: event.details,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: event.createdAt
      }
    });
    console.log(`✅ Created event: ${event.action}`);
  }

  console.log('\n🎉 Events seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
