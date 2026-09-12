import { vi } from 'vitest';

const store = new Map();

vi.mock('ioredis', () => {
  class MockRedis {
    status = 'ready';
    constructor() {}
    async get(key: string) { return store.get(key) || null; }
    async set(key: string, value: string, ...args: any[]) { 
      store.set(key, value); 
      return 'OK'; 
    }
    async del(keys: string | string[]) {
      if (Array.isArray(keys)) {
        keys.forEach(k => store.delete(k));
      } else {
        store.delete(keys);
      }
      return 1;
    }
    async scan() { return ['0', []]; }
    on() {}
    async quit() { return 'OK'; }
    disconnect() {}
  }

  return {
    Redis: MockRedis,
    default: MockRedis,
  };
});
