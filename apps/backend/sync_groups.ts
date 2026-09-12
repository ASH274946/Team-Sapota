import 'dotenv/config';
import prisma from './src/config/prisma';

async function main() {
  const groups = await prisma.group.findMany();
  
  for (const group of groups) {
    const existing = await prisma.communityGroup.findUnique({
      where: { id: group.id }
    });

    if (!existing) {
      console.log(`Creating CommunityGroup for Academic Group: ${group.name} (${group.id})`);
      const communityGroup = await prisma.communityGroup.create({
        data: {
          id: group.id,
          name: group.name,
          description: group.description,
          ownerId: group.facultyId,
          type: 'PRIVATE',
          organizationId: group.organizationId,
        }
      });

      await prisma.groupMember.create({
        data: {
          groupId: communityGroup.id,
          userId: group.facultyId,
          role: 'OWNER'
        }
      });
      console.log('Successfully synced group:', group.id);
    }
  }

  // Find the duplicate Community Group that the student was using (if it exists) and delete it
  // Wait, I will just delete any CommunityGroup named "Data Analytics Forum" that doesn't have a matching Group.
  // Actually, I don't need to delete it. But it might confuse them if they see two.
  const duplicate = await prisma.communityGroup.findUnique({
    where: { id: '243d1b71-b818-4788-89bf-bc0737295c27' }
  });
  if (duplicate) {
    console.log('Deleting duplicate community group:', duplicate.id);
    await prisma.communityGroup.delete({ where: { id: duplicate.id } });
  }

}

main()
  .then(() => console.log('Done syncing groups'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
