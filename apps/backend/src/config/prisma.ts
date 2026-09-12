import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

function createPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:password@localhost:5432/bloom_verify?schema=public';
  const adapter = new PrismaPg({ connectionString, max: 10, idleTimeoutMillis: 20_000 });
  const client = new PrismaClient({ adapter });

  // Force new PrismaClient instance in dev to resolve cached schema issues
  return client;
}

const prisma = createPrisma();

export default prisma;
