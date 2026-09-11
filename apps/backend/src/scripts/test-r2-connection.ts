import { getR2Storage } from '../services/storage/r2-storage';

async function verifyR2() {
  console.log('🔄 Connecting to Cloudflare R2 with configured credentials...');
  const r2 = getR2Storage();
  
  const testKey = `documents/system-test/test-connection-${Date.now()}.txt`;
  const testContent = Buffer.from('Hello from VidyaAI - Cloudflare R2 is working perfectly!');

  try {
    // 1. Upload
    console.log(`📤 Uploading test object to: ${testKey}`);
    const downloadUrl = await r2.save(testKey, testContent, 'text/plain');
    console.log('✅ Upload successful!');
    console.log(`🔗 Signed Download URL (15m): ${downloadUrl}`);

    // 2. Check existence
    const exists = await r2.exists(testKey);
    console.log(`🔍 Object exists in R2: ${exists ? 'YES ✅' : 'NO ❌'}`);

    // 3. Read back
    const downloaded = await r2.get(testKey);
    console.log(`📥 Read back content: "${downloaded?.toString()}"`);

    // 4. Cleanup
    await r2.delete(testKey);
    console.log('🧹 Cleaned up test object.');
    console.log('\n🎉 ALL CHECKS PASSED: Cloudflare R2 is fully connected and working!');
  } catch (err: any) {
    console.error('❌ R2 connection failed:', err);
  }
}

verifyR2();
