import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractTextFromFileBuffer,
  processUploadedFiles,
  extractTextFromDocx,
  cleanExtractedText,
  isImageDescriptionNoise,
  isMeaningfulSyllabusText,
} from '../services/document-extractor.service';
import zlib from 'zlib';

// Helper to create a minimal valid DOCX file buffer (ZIP containing word/document.xml)
function createMockDocxBuffer(paragraphs: string[]): Buffer {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join('\n')}
  </w:body>
</w:document>`;

  const xmlBuffer = Buffer.from(xmlContent, 'utf8');

  // Build standard uncompressed ZIP in memory
  const filename = 'word/document.xml';
  const filenameBuffer = Buffer.from(filename, 'utf8');

  // Local file header
  const localHeader = Buffer.alloc(30);
  localHeader.writeUInt32LE(0x04034b50, 0); // Local header signature
  localHeader.writeUInt16LE(20, 4); // Version needed to extract
  localHeader.writeUInt16LE(0, 6); // General purpose bit flag
  localHeader.writeUInt16LE(0, 8); // Compression method (0 = uncompressed)
  localHeader.writeUInt16LE(0, 10); // Mod time
  localHeader.writeUInt16LE(0, 12); // Mod date
  localHeader.writeUInt32LE(crc32(xmlBuffer), 14); // CRC-32
  localHeader.writeUInt32LE(xmlBuffer.length, 18); // Compressed size
  localHeader.writeUInt32LE(xmlBuffer.length, 22); // Uncompressed size
  localHeader.writeUInt16LE(filenameBuffer.length, 26); // Filename length
  localHeader.writeUInt16LE(0, 28); // Extra field length

  const localFileRecord = Buffer.concat([localHeader, filenameBuffer, xmlBuffer]);

  // Central directory header
  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0); // Central directory signature
  centralHeader.writeUInt16LE(20, 4); // Version made by
  centralHeader.writeUInt16LE(20, 6); // Version needed to extract
  centralHeader.writeUInt16LE(0, 8); // General purpose bit flag
  centralHeader.writeUInt16LE(0, 10); // Compression method (0 = uncompressed)
  centralHeader.writeUInt16LE(0, 12); // Mod time
  centralHeader.writeUInt16LE(0, 14); // Mod date
  centralHeader.writeUInt32LE(crc32(xmlBuffer), 16); // CRC-32
  centralHeader.writeUInt32LE(xmlBuffer.length, 20); // Compressed size
  centralHeader.writeUInt32LE(xmlBuffer.length, 24); // Uncompressed size
  centralHeader.writeUInt16LE(filenameBuffer.length, 28); // Filename length
  centralHeader.writeUInt16LE(0, 30); // Extra field length
  centralHeader.writeUInt16LE(0, 32); // Comment length
  centralHeader.writeUInt16LE(0, 34); // Disk number start
  centralHeader.writeUInt16LE(0, 36); // Internal file attributes
  centralHeader.writeUInt32LE(0, 38); // External file attributes
  centralHeader.writeUInt32LE(0, 42); // Relative offset of local header

  const centralDirectoryRecord = Buffer.concat([centralHeader, filenameBuffer]);

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // Number of this disk
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(1, 8); // Total entries in central directory on this disk
  eocd.writeUInt16LE(1, 10); // Total entries in central directory
  eocd.writeUInt32LE(centralDirectoryRecord.length, 12); // Size of central directory
  eocd.writeUInt32LE(localFileRecord.length, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // Comment length

  return Buffer.concat([localFileRecord, centralDirectoryRecord, eocd]);
}

// Simple CRC32 function for zip mock
function crc32(buf: Buffer): number {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return ~crc >>> 0;
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

describe('Document Extractor Service', () => {
  describe('TXT Extraction', () => {
    it('extracts plain text verbatim from a .txt buffer', async () => {
      const content = 'Unit 1: Introduction to Data Structures\nTopics: Arrays, Linked Lists, Stacks, Queues\nHours: 12';
      const buffer = Buffer.from(content, 'utf8');

      const result = await extractTextFromFileBuffer(buffer, 'syllabus.txt', 'text/plain');
      expect(result).toBe(content);
    });

    it('rejects an empty .txt file with descriptive error', async () => {
      const buffer = Buffer.alloc(0);
      await expect(extractTextFromFileBuffer(buffer, 'empty.txt', 'text/plain')).rejects.toThrow(
        'File "empty.txt" is empty.'
      );
    });
  });

  describe('Markdown (MD) Extraction', () => {
    it('extracts markdown text and preserves structure', async () => {
      const mdContent = '# Course Outline\n\n## Unit 1: Cloud Architecture\n- Microservices\n- Serverless\n- Containers';
      const buffer = Buffer.from(mdContent, 'utf8');

      const result = await extractTextFromFileBuffer(buffer, 'course.md', 'text/markdown');
      expect(result).toBe(mdContent);
      expect(result).toContain('# Course Outline');
      expect(result).toContain('## Unit 1: Cloud Architecture');
    });
  });

  describe('DOCX Extraction', () => {
    it('extracts paragraphs from Word DOCX archive xml', async () => {
      const paragraphs = [
        'Unit 1: Object Oriented Programming &amp; Principles',
        'Topics: Encapsulation, Polymorphism, Inheritance, Abstraction',
        'Course Outcomes: CO1, CO2',
      ];
      const docxBuffer = createMockDocxBuffer(paragraphs);

      const result = await extractTextFromDocx(docxBuffer);
      expect(result).toContain('Unit 1: Object Oriented Programming & Principles');
      expect(result).toContain('Topics: Encapsulation, Polymorphism, Inheritance, Abstraction');
      expect(result).toContain('Course Outcomes: CO1, CO2');
    });

    it('processes docx via extractTextFromFileBuffer router', async () => {
      const paragraphs = ['Unit 3: Database Management Systems', 'Topics: SQL, Normalization, ACID Properties'];
      const docxBuffer = createMockDocxBuffer(paragraphs);

      const result = await extractTextFromFileBuffer(
        docxBuffer,
        'dbms_syllabus.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
      expect(result).toContain('Unit 3: Database Management Systems');
      expect(result).toContain('Topics: SQL, Normalization, ACID Properties');
    });
  });

  describe('Multi-File Batch Processing & Aggregation', () => {
    it('processes multiple files independently and aggregates with distinct headers', async () => {
      const file1Buffer = Buffer.from('Unit 1: Computer Networks\nTopics: OSI Model, TCP/IP', 'utf8');
      const file2Buffer = Buffer.from('Unit 2: Routing Protocols\nTopics: BGP, OSPF, RIP', 'utf8');

      const mockFiles: any[] = [
        {
          originalname: 'Unit 1.txt',
          mimetype: 'text/plain',
          path: 'temp/unit1.txt',
        },
        {
          originalname: 'Unit 2.txt',
          mimetype: 'text/plain',
          path: 'temp/unit2.txt',
        },
      ];

      // Mock fs.readFileSync
      const fsSpy = vi.spyOn(require('fs'), 'readFileSync').mockImplementation((p: any) => {
        if (p === 'temp/unit1.txt') return file1Buffer;
        if (p === 'temp/unit2.txt') return file2Buffer;
        return Buffer.alloc(0);
      });
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
      vi.spyOn(require('fs'), 'unlinkSync').mockImplementation(() => {});

      const batchResult = await processUploadedFiles(mockFiles);

      expect(batchResult.results).toHaveLength(2);
      expect(batchResult.results[0].status).toBe('success');
      expect(batchResult.results[0].filename).toBe('Unit 1.txt');
      expect(batchResult.results[1].status).toBe('success');
      expect(batchResult.results[1].filename).toBe('Unit 2.txt');

      // Check combined content formatting
      expect(batchResult.content).toContain('===== Unit 1.txt =====');
      expect(batchResult.content).toContain('Unit 1: Computer Networks');
      expect(batchResult.content).toContain('===== Unit 2.txt =====');
      expect(batchResult.content).toContain('Unit 2: Routing Protocols');

      fsSpy.mockRestore();
    });

    it('handles individual file failures gracefully without breaking the rest of the batch', async () => {
      const validBuffer = Buffer.from('Unit 3: Distributed Systems', 'utf8');
      const emptyBuffer = Buffer.alloc(0);

      const mockFiles: any[] = [
        {
          originalname: 'ValidUnit.txt',
          mimetype: 'text/plain',
          path: 'temp/valid.txt',
        },
        {
          originalname: 'BrokenEmpty.txt',
          mimetype: 'text/plain',
          path: 'temp/empty.txt',
        },
      ];

      vi.spyOn(require('fs'), 'readFileSync').mockImplementation((p: any) => {
        if (p === 'temp/valid.txt') return validBuffer;
        return emptyBuffer;
      });
      vi.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
      vi.spyOn(require('fs'), 'unlinkSync').mockImplementation(() => {});

      const batchResult = await processUploadedFiles(mockFiles);

      expect(batchResult.results).toHaveLength(2);
      expect(batchResult.results[0].status).toBe('success');
      expect(batchResult.results[1].status).toBe('error');
      expect(batchResult.results[1].error).toContain('is empty');

      // Only valid file content is included in combined text
      expect(batchResult.content).toContain('Unit 3: Distributed Systems');
    });
  });

  describe('Unsupported File Types', () => {
    it('throws informative error for unsupported binary format', async () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      await expect(extractTextFromFileBuffer(buffer, 'program.exe', 'application/x-msdownload')).rejects.toThrow(
        'Unsupported file type ".exe"'
      );
    });
  });

  describe('Image Description Noise Detection & Post-Processing Cleanup', () => {
    it('detects and flags image description and visual observation noise', () => {
      expect(isImageDescriptionNoise('The image shows a screenshot of a syllabus or lesson plan.')).toBe(true);
      expect(isImageDescriptionNoise('The title at the top reads Course Outline.')).toBe(true);
      expect(isImageDescriptionNoise('Below the title, there are multiple units listed.')).toBe(true);
      expect(isImageDescriptionNoise('At the bottom of the screen, there is a navigation button.')).toBe(true);
      expect(isImageDescriptionNoise('The background of the image is white.')).toBe(true);
      expect(isImageDescriptionNoise('Overall, the image appears to be a mobile screenshot.')).toBe(true);
      expect(isImageDescriptionNoise('12:45 PM | 100% | 5G')).toBe(true);
      expect(isImageDescriptionNoise('Battery: 85% Wi-Fi signal')).toBe(true);
    });

    it('does NOT flag legitimate syllabus content as noise', () => {
      expect(isImageDescriptionNoise('Unit 1: Data Structures and Algorithms')).toBe(false);
      expect(isImageDescriptionNoise('Topic 1.1: Arrays and Linked Lists')).toBe(false);
      expect(isImageDescriptionNoise('Revision: Foundational mathematical concepts and proofs')).toBe(false);
      expect(isImageDescriptionNoise('Tutorial 1: Solving recurrence relations using Master Theorem')).toBe(false);
      expect(isImageDescriptionNoise('Seminar: Modern Distributed Database Architecture')).toBe(false);
      expect(isImageDescriptionNoise('CO1: Understand core principles of relational database design')).toBe(false);
      expect(isImageDescriptionNoise('Students will learn how to formulate SQL queries and optimize them.')).toBe(false);
    });

    it('strips image description noise while preserving legitimate syllabus content', () => {
      const noisyOutput = `The image shows a screenshot of a syllabus or lesson plan.
The title at the top reads Computer Science 101.
Below the title, we have the following content:
The background of the image is white.

Unit 1: Advanced Operating Systems
Topics: Process Scheduling, Synchronization, Deadlock Prevention
Tutorial 1: Semaphore Implementation in C
Revision: CPU Scheduling Algorithms

At the bottom of the screen, there is a footer.
Overall, the image appears to be a course syllabus.`;

      const cleaned = cleanExtractedText(noisyOutput);

      expect(cleaned).not.toContain('The image shows');
      expect(cleaned).not.toContain('The title at the top');
      expect(cleaned).not.toContain('Below the title');
      expect(cleaned).not.toContain('The background of the image');
      expect(cleaned).not.toContain('At the bottom of the screen');
      expect(cleaned).not.toContain('Overall, the image appears');

      expect(cleaned).toContain('Unit 1: Advanced Operating Systems');
      expect(cleaned).toContain('Topics: Process Scheduling, Synchronization, Deadlock Prevention');
      expect(cleaned).toContain('Tutorial 1: Semaphore Implementation in C');
      expect(cleaned).toContain('Revision: CPU Scheduling Algorithms');
    });

    it('validates meaningful syllabus text vs pure noise', () => {
      const validText = 'Unit 2: Database Systems\nTopics: Relational Algebra, SQL Queries';
      expect(isMeaningfulSyllabusText(validText)).toBe(true);

      const pureNoise = `The image shows a screenshot of a syllabus.
The title at the top reads something.
Overall, the image is white.`;
      expect(isMeaningfulSyllabusText(pureNoise)).toBe(false);

      expect(isMeaningfulSyllabusText('')).toBe(false);
      expect(isMeaningfulSyllabusText('   ')).toBe(false);
    });
  });
});
