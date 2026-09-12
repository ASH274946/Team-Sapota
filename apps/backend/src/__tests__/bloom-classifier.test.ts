import { describe, it, expect } from 'vitest';
import { BloomClassifierService } from '../services/obe/bloom.service';

describe('BloomClassifierService', () => {
  // 1. Remember Level Tests
  it('classifies Remember level questions accurately', () => {
    const res1 = BloomClassifierService.classify('Define the concept of object polymorphism in C++.');
    expect(res1.level).toBe('REMEMBER');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = BloomClassifierService.classify('List the seven layers of the OSI networking model.');
    expect(res2.level).toBe('REMEMBER');

    const res3 = BloomClassifierService.classify('State the primary key constraints in SQL database design.');
    expect(res3.level).toBe('REMEMBER');
  });

  // 2. Understand Level Tests
  it('classifies Understand level questions accurately', () => {
    const res1 = BloomClassifierService.classify('Explain how DNS domain name resolution works under the hood.');
    expect(res1.level).toBe('UNDERSTAND');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = BloomClassifierService.classify('Describe the main differences between TCP and UDP protocols.');
    expect(res2.level).toBe('UNDERSTAND');

    const res3 = BloomClassifierService.classify('Summarize the three-way handshake connection establishment process.');
    expect(res3.level).toBe('UNDERSTAND');
  });

  // 3. Apply Level Tests
  it('classifies Apply level questions accurately', () => {
    const res1 = BloomClassifierService.classify('Calculate the subnet mask and broadcast IP address for 192.168.1.0/26.');
    expect(res1.level).toBe('APPLY');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = BloomClassifierService.classify('Implement a binary search algorithm in TypeScript.');
    expect(res2.level).toBe('APPLY');

    const res3 = BloomClassifierService.classify('Solve the system of linear equations using Gaussian elimination.');
    expect(res3.level).toBe('APPLY');
  });

  // 4. Analyze Level Tests
  it('classifies Analyze level questions accurately', () => {
    const res1 = BloomClassifierService.classify('Analyze the performance bottleneck in this recursive Fibonacci algorithm.');
    expect(res1.level).toBe('ANALYZE');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = BloomClassifierService.classify('Compare and contrast SQL relational vs NoSQL document database architectures.');
    expect(res2.level).toBe('ANALYZE');

    const res3 = BloomClassifierService.classify('Deconstruct the microservice dependency graph to identify single points of failure.');
    expect(res3.level).toBe('ANALYZE');
  });

  // 5. Evaluate Level Tests
  it('classifies Evaluate level questions accurately', () => {
    const res1 = BloomClassifierService.classify('Evaluate which database design is more suitable for real-time analytics and justify your choice.');
    expect(res1.level).toBe('EVALUATE');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = BloomClassifierService.classify('Critique the security architecture of the given JWT authentication flow.');
    expect(res2.level).toBe('EVALUATE');

    const res3 = BloomClassifierService.classify('Assess the trade-offs between consistency and availability under CAP theorem.');
    expect(res3.level).toBe('EVALUATE');
  });

  // 6. Create Level Tests
  it('classifies Create level questions accurately', () => {
    const res1 = BloomClassifierService.classify('Design a scalable distributed event-driven notification architecture for 10 million users.');
    expect(res1.level).toBe('CREATE');
    expect(res1.confidence).toBeGreaterThan(0.5);

    const res2 = BloomClassifierService.classify('Develop a new rate-limiting algorithm using sliding window token buckets.');
    expect(res2.level).toBe('CREATE');

    const res3 = BloomClassifierService.classify('Formulate a comprehensive disaster recovery plan for multi-region cloud deployment.');
    expect(res3.level).toBe('CREATE');
  });

  // 7. Ambiguous Prompts Resolution
  it('resolves ambiguous questions by prioritizing higher-order cognitive operations', () => {
    // "Explain" vs "design" -> "design a scalable system" is a higher-order CREATE operation
    const res1 = BloomClassifierService.classify('Explain how you would design a scalable payment gateway.');
    expect(res1.level).toBe('CREATE');

    // "Describe" vs "evaluate" -> "evaluate trade-offs" is an EVALUATE operation
    const res2 = BloomClassifierService.classify('Describe and evaluate the trade-offs of microservice vs monolithic architectures.');
    expect(res2.level).toBe('EVALUATE');

    // "Discuss" vs "compare" -> "compare between" is an ANALYZE operation
    const res3 = BloomClassifierService.classify('Discuss and compare the differences between REST and GraphQL APIs.');
    expect(res3.level).toBe('ANALYZE');
  });

  // 8. Deterministic Confidence Scoring
  it('produces deterministic confidence scores for identical inputs', () => {
    const prompt = 'Calculate the matrix multiplication complexity.';
    const run1 = BloomClassifierService.classify(prompt);
    const run2 = BloomClassifierService.classify(prompt);

    expect(run1.level).toBe(run2.level);
    expect(run1.confidence).toBe(run2.confidence);
    expect(run1.scores).toEqual(run2.scores);
  });

  // 9. Taxonomy Configuration & Custom Overrides
  it('respects custom taxonomy config overrides', () => {
    const res = BloomClassifierService.classify('Synthesize the findings from the research papers.', {
      version: '2.0-custom',
      customVerbs: { synthesize: 'EVALUATE' },
    });
    expect(res.level).toBe('EVALUATE');
  });
});
