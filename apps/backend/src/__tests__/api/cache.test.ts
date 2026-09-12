import { describe, it, expect } from 'vitest';
import { getCached, setCached, invalidateCache, getOrSet } from '../../api/common/cache';

describe('Cache Service', () => {
  it('should store and retrieve values', async () => {
    await setCached('test:key', { hello: 'world' }, 60);
    const result = await getCached<{ hello: string }>('test:key');
    expect(result).toEqual({ hello: 'world' });
    await invalidateCache('test:key');
  });

  it('should return null for missing keys', async () => {
    const result = await getCached('nonexistent:key');
    expect(result).toBeNull();
  });

  it('should fetch and cache with getOrSet', async () => {
    let callCount = 0;
    const fetch = async () => { callCount++; return { value: 42 }; };

    const first = await getOrSet('test:getorset', fetch, 60);
    expect(first).toEqual({ value: 42 });
    expect(callCount).toBe(1);

    const second = await getOrSet('test:getorset', fetch, 60);
    expect(second).toEqual({ value: 42 });
    expect(callCount).toBe(1); // Should not call fetch again

    await invalidateCache('test:getorset');
  });
});
