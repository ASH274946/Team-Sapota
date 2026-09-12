import prisma from './src/config/prisma';

async function main() {
  const users = await prisma.user.findMany();
  let updated = 0;
  for (const user of users) {
    const lowerEmail = user.email.toLowerCase();
    if (user.email !== lowerEmail) {
      console.log(`Updating ${user.email} -> ${lowerEmail}`);
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: lowerEmail }
        });
        updated++;
      } catch (err) {
        console.error(`Error updating ${user.email}:`, err);
      }
    }
  }
  console.log(`Updated ${updated} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
