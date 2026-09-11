import { describe, it, expect, vi, beforeEach } from 'vitest';
import { R2StorageAdapter } from '../services/storage/r2-storage';

const mockSend = vi.fn();

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class {
      send = mockSend;
    },
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
    HeadObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://mock-r2.cloudflarestorage.com/signed-url'),
}));

describe('R2 Storage Adapter', () => {
  let adapter: R2StorageAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockReset();
    adapter = new R2StorageAdapter();
  });

  it('saves buffer to R2 bucket and returns presigned download URL', async () => {
    mockSend.mockResolvedValueOnce({});
    const buffer = Buffer.from('test syllabus content');
    const url = await adapter.save('syllabus/course1/unit1.pdf', buffer, 'application/pdf');

    expect(mockSend).toHaveBeenCalled();
    expect(url).toBeDefined();
  });

  it('gets buffer from R2 bucket correctly', async () => {
    const stream = (async function* () {
      yield Buffer.from('chunk1 ');
      yield Buffer.from('chunk2');
    })();

    mockSend.mockResolvedValueOnce({ Body: stream });
    const result = await adapter.get('documents/doc1.txt');

    expect(result).not.toBeNull();
    expect(result?.toString()).toBe('chunk1 chunk2');
  });

  it('checks if key exists in R2', async () => {
    mockSend.mockResolvedValueOnce({});
    const exists = await adapter.exists('documents/doc1.txt');
    expect(exists).toBe(true);

    mockSend.mockRejectedValueOnce(new Error('NotFound'));
    const notExists = await adapter.exists('documents/missing.txt');
    expect(notExists).toBe(false);
  });

  it('deletes object from R2', async () => {
    mockSend.mockResolvedValueOnce({});
    await expect(adapter.delete('documents/doc1.txt')).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalled();
  });

  it('generates presigned upload URL with expiration', async () => {
    const uploadUrl = await adapter.getPresignedUploadUrl('students/s1/file.pdf', 'application/pdf', 600);
    expect(uploadUrl).toBeDefined();
  });
});
