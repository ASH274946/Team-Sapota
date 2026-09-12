import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const files = [
    '../../../migration/sql/03_rls_policies.sql',
    '../../../migration/sql/04_auth_triggers.sql',
    '../../../migration/sql/05_indexes.sql'
  ];

  for (const relativePath of files) {
    const fullPath = path.resolve(__dirname, relativePath);
    console.log(`Executing ${fullPath}...`);
    try {
      const sql = fs.readFileSync(fullPath, 'utf-8');
      
      // Since it's raw SQL with multiple statements, executeRawUnsafe works on PG
      await prisma.$executeRawUnsafe(sql);
      console.log(`Success: ${relativePath}`);
    } catch(e: any) {
      console.error(`Error in ${relativePath}:`, e.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
