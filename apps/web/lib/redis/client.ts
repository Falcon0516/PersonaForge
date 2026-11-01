import { Redis } from "@upstash/redis";

export interface IRedisClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number; px?: number }): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<string>;
}

class MemoryRedisAdapter implements IRedisClient {
  private store = new Map<string, { val: any; expiresAt?: number }>();

  private cleanKey(key: string): boolean {
    const item = this.store.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (!this.cleanKey(key)) return null;
    const item = this.store.get(key);
    return (item ? item.val : null) as T | null;
  }

  async set(key: string, value: unknown, opts?: { ex?: number; px?: number }): Promise<string | null> {
    let expiresAt: number | undefined;
    if (opts?.ex) {
      expiresAt = Date.now() + opts.ex * 1000;
    } else if (opts?.px) {
      expiresAt = Date.now() + opts.px;
    }
    this.store.set(key, { val: value, expiresAt });
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async incr(key: string): Promise<number> {
    if (!this.cleanKey(key)) {
      this.store.set(key, { val: 1 });
      return 1;
    }
    const current = Number(this.store.get(key)?.val || 0);
    const next = current + 1;
    const existing = this.store.get(key);
    this.store.set(key, { val: next, expiresAt: existing?.expiresAt });
    return next;
  }

  async ttl(key: string): Promise<number> {
    if (!this.cleanKey(key)) return -2;
    const item = this.store.get(key);
    if (!item?.expiresAt) return -1;
    const remainingMs = item.expiresAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const [k, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.store.delete(k);
        continue;
      }
      if (regex.test(k)) {
        result.push(k);
      }
    }
    return result;
  }

  async flushall(): Promise<string> {
    this.store.clear();
    return "OK";
  }
}

let redisInstance: IRedisClient | null = null;

export function getRedisClient(): IRedisClient {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token && !url.includes("your-upstash")) {
    try {
      const client = new Redis({ url, token });
      redisInstance = client as unknown as IRedisClient;
      return redisInstance;
    } catch {
      // Fallback to in-memory adapter
    }
  }

  redisInstance = new MemoryRedisAdapter();
  return redisInstance;
}

export function createMemoryRedis(): IRedisClient {
  return new MemoryRedisAdapter();
}
