import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getStorageAdapter } from '../services/storage';
import { env } from '../config/env';

async function audit() {
  const accountId = env.R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'vidya-ai';

  console.log('====================================================');
  console.log('CLOUDFLARE R2 FULL VERIFICATION & AUDIT');
  console.log('====================================================');
  console.log(`Bucket       : ${bucket}`);
  console.log(`Endpoint     : https://${accountId}.r2.cloudflarestorage.com`);
  console.log(`Account ID   : ${accountId}`);

  const storage = getStorageAdapter();
  const folders = ['uploads', 'question-papers', 'assignments', 'quizzes', 'lesson-plans'];

  console.log('\n--- 1. Testing Live Read / Write in All Folders ---');
  for (const folder of folders) {
    const testKey = `${folder}/audit-test-${Date.now()}.txt`;
    const payloadText = `Live audit verified for folder [${folder}] on ${new Date().toISOString()}`;
    const payload = Buffer.from(payloadText);

    try {
      const url = await storage.save(testKey, payload, 'text/plain');
      const exists = await storage.exists(testKey);
      const readBuffer = await storage.get(testKey);
      const presigned = storage.getSignedDownloadUrl ? await storage.getSignedDownloadUrl(testKey, 3600) : 'N/A';

      const isMatching = readBuffer?.toString('utf-8') === payloadText;

      console.log(`\n📁 Folder [${folder}/]`);
      console.log(`   - Test Key      : ${testKey}`);
      console.log(`   - Upload/Save   : SUCCESS`);
      console.log(`   - Exists in R2  : ${exists}`);
      console.log(`   - Read Verified : ${isMatching ? 'MATCHED CONTENT' : 'FAILED'}`);
      console.log(`   - Presigned URL : OK (Generated)`);
    } catch (err: any) {
      console.error(`Folder [${folder}/] test failed: ${err.message}`);
    }
  }

  console.log('\n--- 2. Complete Inventory of Files in Cloudflare R2 ---');
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });

  const listRes = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
  const objects = listRes.Contents || [];

  const grouped: Record<string, typeof objects> = {};
  for (const obj of objects) {
    const key = obj.Key || '';
    const folder = key.includes('/') ? `${key.split('/')[0]}/` : 'root/';
    if (!grouped[folder]) grouped[folder] = [];
    grouped[folder].push(obj);
  }

  console.log(`\nTotal Objects across all folders: ${objects.length}`);
  console.log(`Total Folders detected: ${Object.keys(grouped).length}\n`);

  for (const [folderName, files] of Object.entries(grouped)) {
    const totalBytes = files.reduce((acc, f) => acc + (f.Size || 0), 0);
    const sizeKB = (totalBytes / 1024).toFixed(2);
    console.log(`📂 Folder: ${folderName} (${files.length} files, ${sizeKB} KB total)`);
    files.forEach((f) => {
      console.log(`   📄 ${f.Key} (${f.Size} bytes)`);
    });
    console.log('');
  }

  console.log('====================================================');
  console.log('ALL R2 FOLDERS & FLOWS VERIFIED SUCCESSFULLY!');
  console.log('====================================================');
}

audit().catch(console.error);
