require('dotenv').config();
const { Client } = require('pg');
const argon2 = require('argon2');

async function main() {
  const client = new Client(process.env.DIRECT_URL);
  await client.connect();
  const hash = await argon2.hash('Admin@123');
  await client.query('UPDATE "User" SET "passwordHash" = $1 WHERE email = \'super@vidyaai.com\'', [hash]);
  console.log('Password reset successfully for super@vidyaai.com');
  await client.end();
}

main().catch(console.error);
