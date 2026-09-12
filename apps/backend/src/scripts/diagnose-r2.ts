import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';

async function diagnose() {
  const accountId = env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  
  console.log('Diagnosis parameters:', {
    accountId,
    accessKeyIdLength: accessKeyId?.length,
    secretLength: secretAccessKey?.length,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  });

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });

  try {
    console.log('Attempting ListBuckets...');
    const result = await client.send(new ListBucketsCommand({}));
    console.log('✅ ListBuckets succeeded! Buckets found:');
    result.Buckets?.forEach(b => console.log(' -', b.Name));
  } catch (err: any) {
    console.error('❌ ListBuckets failed:', err.message, err.Code || err.name);
  }
}

diagnose();
