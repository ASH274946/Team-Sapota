const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function main() {
  const pwdHash = await argon2.hash('Admin@123');
  const user = await prisma.user.upsert({
    where: { email: 'qa-superadmin@example.com' },
    update: { passwordHash: pwdHash, role: 'SUPER_ADMIN' },
    create: {
      email: 'qa-superadmin@example.com',
      passwordHash: pwdHash,
      firstName: 'QA',
      lastName: 'Superadmin',
      role: 'SUPER_ADMIN',
    }
  });
  console.log('Created super admin:', user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
