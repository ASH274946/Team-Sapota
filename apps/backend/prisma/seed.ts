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

async function main() {
  console.log('Starting seed execution...');

  // 1. Seed Permissions
  const permissionsList = [
    { name: 'CREATE_PAPER', description: 'Can synthesize question papers' },
    { name: 'DELETE_PAPER', description: 'Can delete question papers' },
    { name: 'EDIT_PAPER', description: 'Can modify question papers' },
    { name: 'MANAGE_USERS', description: 'Can create, edit, suspend, and delete users' },
    { name: 'VIEW_ANALYTICS', description: 'Can view platform statistics and token usages' },
    { name: 'CREATE_CLASSES', description: 'Can create class structures' },
    { name: 'CREATE_GROUPS', description: 'Can create and configure group rosters' },
  ];

  console.log('Seeding permissions...');
  const seededPermissions: Record<string, any> = {};
  for (const perm of permissionsList) {
    const record = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
    seededPermissions[perm.name] = record;
  }

  // 2. Seed Roles and map Permissions
  const rolesList = [
    { name: 'SUPER_ADMIN', description: 'Full system control', permissions: permissionsList.map(p => p.name) },
    { name: 'INSTITUTION_ADMIN', description: 'Institution wide configurations', permissions: ['MANAGE_USERS', 'VIEW_ANALYTICS', 'CREATE_CLASSES', 'CREATE_GROUPS'] },
    { name: 'DEPARTMENT_ADMIN', description: 'Department configurations', permissions: ['MANAGE_USERS', 'CREATE_CLASSES', 'CREATE_GROUPS'] },
    { name: 'HOD', description: 'Head of department access', permissions: ['CREATE_PAPER', 'EDIT_PAPER'] },
    { name: 'FACULTY', description: 'Standard teacher access', permissions: ['CREATE_PAPER', 'EDIT_PAPER'] },
    { name: 'STUDENT', description: 'Access to quizzes and assignments', permissions: [] },
    { name: 'PARENT', description: 'Monitor student analytics', permissions: [] },
  ];

  console.log('Seeding roles and linking permissions...');
  const seededRoles: Record<string, any> = {};
  for (const roleDef of rolesList) {
    const roleRecord = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: {
        name: roleDef.name,
        description: roleDef.description,
        permissions: {
          connect: roleDef.permissions.map(name => ({ id: seededPermissions[name].id })),
        },
      },
    });
    seededRoles[roleDef.name] = roleRecord;
  }

  // 3. Seed Default SUPER_ADMIN user
  const adminEmail = 'admin@vidyaai.com';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  
  if (!adminUser) {
    console.log('Creating default super admin user...');
    const pwdHash = await argon2.hash('Admin@123');
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: pwdHash,
        firstName: 'System',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        forcePasswordReset: true,
        preferences: {
          emailNotifications: true,
          inAppAlerts: true,
          autoSave: true,
        },
      },
    });

    // Map UserRole
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: seededRoles['SUPER_ADMIN'].id,
      },
    });
    console.log('Super admin seeded successfully.');
  }

  // 4. Seed Legacy Demo Faculty & Data
  const demoFacultyId = 'demo-faculty-id';
  let demoFaculty = await prisma.user.findUnique({ where: { id: demoFacultyId } });

  let inst = await prisma.organization.findUnique({ where: { id: 'demo-org-id' } });
  if (!inst) {
    console.log('Seeding legacy demo school...');
    inst = await prisma.organization.create({
      data: {
        id: 'demo-org-id',
        name: 'VidyaAI Demo School',
        email: 'info@vidyaai.demo',
        code: 'VEDAAI_DEMO',
        address: '123 AI Boulevard, Silicon Valley',
        phone: '+1-555-0199',
        status: 'ACTIVE',
      },
    });
  }

  if (!demoFaculty) {
    console.log('Seeding legacy demo faculty user...');
    const pwdHash = await argon2.hash('demo-password');
    demoFaculty = await prisma.user.create({
      data: {
        id: demoFacultyId,
        email: 'demo@bloomverify.com',
        passwordHash: pwdHash,
        firstName: 'Demo',
        lastName: 'Faculty',
        role: 'TEACHER',
        organizationId: inst.id,
        preferences: {
          emailNotifications: true,
          inAppAlerts: true,
          autoSave: true,
          weeklyDigest: false,
          onboardingCompleted: true,
        },
      },
    });

    // Map dynamic UserRole for legacy compatibility
    await prisma.userRole.create({
      data: {
        userId: demoFaculty.id,
        roleId: seededRoles['FACULTY'].id,
      },
    });
  }

  // Demo Syllabus, groups, and students
  const classGroupExists = await prisma.classGroup.findFirst({ where: { userId: demoFacultyId } });
  if (!classGroupExists) {
    console.log('Seeding demo syllabus, class groups, and students roster...');
    const group = await prisma.classGroup.create({
      data: {
        id: 'demo-group-1',
        name: 'Class 10-A',
        subject: 'Computer Science',
        userId: demoFacultyId,
      },
    });

    await prisma.student.createMany({
      data: [
        { id: 'demo-student-1', groupId: group.id, name: 'Alice Johnson', rollNo: 'R-101', email: 'alice.johnson@school.edu' },
        { id: 'demo-student-2', groupId: group.id, name: 'Bob Smith', rollNo: 'R-102', email: 'bob.smith@school.edu' },
        { id: 'demo-student-3', groupId: group.id, name: 'Charlie Brown', rollNo: 'R-103', email: 'charlie.brown@school.edu' },
      ],
    });

    await prisma.syllabus.create({
      data: {
        id: 'demo-syllabus-1',
        title: 'Class 10 Computer Science Syllabus',
        subject: 'Computer Science',
        grade: 'Class 10',
        userId: demoFacultyId,
        topics: {
          create: [
            {
              id: 'demo-topic-1',
              title: 'Introduction to Programming',
              description: 'Basics of programming languages and logic',
              duration: 120,
              topicOrder: 0,
              subtopics: {
                create: [
                  { id: 'demo-subtopic-1', title: 'What is Programming?', topicOrder: 0 },
                  { id: 'demo-subtopic-2', title: 'Variables & Data Types', topicOrder: 1 },
                  { id: 'demo-subtopic-3', title: 'Control Structures', topicOrder: 2 },
                ],
              },
            },
            {
              id: 'demo-topic-2',
              title: 'Data Structures',
              description: 'Arrays, Lists, and Dictionaries',
              duration: 180,
              topicOrder: 1,
              subtopics: {
                create: [
                  { id: 'demo-subtopic-4', title: 'Arrays', topicOrder: 0 },
                  { id: 'demo-subtopic-5', title: 'Linked Lists', topicOrder: 1 },
                  { id: 'demo-subtopic-6', title: 'Stacks & Queues', topicOrder: 2 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  console.log('Database seeding successfully finished.');
}

main()
  .catch((e) => {
    console.error('Seed execution error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
