import { createHash } from "crypto";
import { getRedisClient, IRedisClient } from "../redis/client";

export interface KeyEntry {
  alias: string; // "k1", "k2", etc.
  index: number;
  key: string;
}

export interface KeyStatus {
  alias: string;
  status: "healthy" | "cooling" | "dead";
  cooldownRemainingSeconds: number;
  requestsLastHour: number;
  rateLimitsLastHour: number;
  lastErrorClass?: string;
}

export interface KeyPoolOptions {
  redis?: IRedisClient;
  customKeys?: string[];
  maxAttempts?: number;
  defaultCooldownSec?: number;
  defaultModel?: string;
  fallbackModels?: string[];
}

export class GroqKeyPool {
  private redis: IRedisClient;
  private keys: KeyEntry[] = [];
  private maxAttempts: number;
  private defaultCooldownSec: number;
  private defaultModel: string;
  private fallbackModels: string[];

  constructor(options: KeyPoolOptions = {}) {
    this.redis = options.redis || getRedisClient();
    this.maxAttempts = options.maxAttempts || 4;
    this.defaultCooldownSec = options.defaultCooldownSec || 60;
    this.defaultModel =
      options.defaultModel || process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile";

    const fallbacksEnv = process.env.GROQ_FALLBACK_MODELS;
    this.fallbackModels = options.fallbackModels || (fallbacksEnv ? fallbacksEnv.split(",") : ["llama-3.1-8b-instant"]);

    // Initialize key list
    const rawKeys =
      options.customKeys ||
      (process.env.GROQ_API_KEYS ? process.env.GROQ_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean) : []);

    const limitedKeys = rawKeys.slice(0, 10);
    this.keys = limitedKeys.map((k, idx) => ({
      alias: `k${idx + 1}`,
      index: idx + 1,
      key: k,
    }));
  }

  getKeyCount(): number {
    return this.keys.length;
  }

  getKeys(): { alias: string; index: number }[] {
    return this.keys.map((k) => ({ alias: k.alias, index: k.index }));
  }

  async isKeyDead(index: number): Promise<boolean> {
    const dead = await this.redis.get<string>(`kp:dead:${index}`);
    return Boolean(dead);
  }

  async markKeyDead(index: number, reason: string): Promise<void> {
    await this.redis.set(`kp:dead:${index}`, reason);
  }

  async isKeyCooling(index: number): Promise<boolean> {
    const cool = await this.redis.get<string>(`kp:cool:${index}`);
    return Boolean(cool);
  }

  async getCooldownTtl(index: number): Promise<number> {
    return this.redis.ttl(`kp:cool:${index}`);
  }

  async setKeyCooldown(index: number, seconds: number, reason?: string): Promise<void> {
    const sec = Math.max(1, seconds);
    await this.redis.set(`kp:cool:${index}`, reason || "cooling", { ex: sec });
  }

  async recordRequest(index: number, isRateLimit = false): Promise<void> {
    const hour = Math.floor(Date.now() / 3600000);
    const key = `kp:stats:${index}:${hour}`;
    await this.redis.incr(key);
    if (isRateLimit) {
      await this.redis.incr(`kp:429:${index}:${hour}`);
    }
  }

  /**
   * Round-robin selection across available non-cooling, non-dead keys
   */
  async getNextKey(): Promise<KeyEntry | null> {
    if (this.keys.length === 0) return null;

    const total = this.keys.length;
    const rr = await this.redis.incr("kp:rr");

    // Scan up to total count starting from rr offset
    for (let i = 0; i < total; i++) {
      const idx = (rr + i) % total;
      const candidate = this.keys[idx]!;

      const isDead = await this.isKeyDead(candidate.index);
      if (isDead) continue;

      const isCooling = await this.isKeyCooling(candidate.index);
      if (isCooling) continue;

      return candidate;
    }

    return null;
  }

  /**
   * Find the soonest key to recover when all are cooling
   */
  async getSoonestRecovery(): Promise<{ key: KeyEntry; remainingSec: number } | null> {
    let bestKey: KeyEntry | null = null;
    let minTtl = Infinity;

    for (const key of this.keys) {
      const isDead = await this.isKeyDead(key.index);
      if (isDead) continue;

      const ttl = await this.getCooldownTtl(key.index);
      if (ttl > 0 && ttl < minTtl) {
        minTtl = ttl;
        bestKey = key;
      }
    }

    return bestKey ? { key: bestKey, remainingSec: minTtl } : null;
  }

  /**
   * Compute exact-match cache key for stateless bots
   */
  computeCacheKey(model: string, messages: { role: string; content: string }[]): string {
    const payload = JSON.stringify({ model, messages });
    return `llm:cache:${createHash("sha256").update(payload).digest("hex")}`;
  }

  async getCachedResponse(cacheKey: string): Promise<string | null> {
    return this.redis.get<string>(cacheKey);
  }

  async setCachedResponse(cacheKey: string, reply: string, ttlSeconds = 3600): Promise<void> {
    await this.redis.set(cacheKey, reply, { ex: ttlSeconds });
  }

  /**
   * Extract Retry-After seconds from HTTP response headers
   */
  parseRetryAfter(headers: Headers): number {
    const retryAfter = headers.get("retry-after");
    if (retryAfter) {
      const parsed = parseInt(retryAfter, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }

    const resetRequests = headers.get("x-ratelimit-reset-requests");
    if (resetRequests) {
      const parsed = parseFloat(resetRequests);
      if (!isNaN(parsed) && parsed > 0) return Math.ceil(parsed);
    }

    const resetTokens = headers.get("x-ratelimit-reset-tokens");
    if (resetTokens) {
      const parsed = parseFloat(resetTokens);
      if (!isNaN(parsed) && parsed > 0) return Math.ceil(parsed);
    }

    return this.defaultCooldownSec;
  }

  /**
   * Inspect current key pool status for /admin/keys (Never exposes key values)
   */
  async getStatus(): Promise<KeyStatus[]> {
    const hour = Math.floor(Date.now() / 3600000);
    const result: KeyStatus[] = [];

    for (const entry of this.keys) {
      const isDead = await this.isKeyDead(entry.index);
      const isCooling = await this.isKeyCooling(entry.index);
      const ttl = isCooling ? await this.getCooldownTtl(entry.index) : 0;
      const reqCount = (await this.redis.get<number>(`kp:stats:${entry.index}:${hour}`)) || 0;
      const rateLimitCount = (await this.redis.get<number>(`kp:429:${entry.index}:${hour}`)) || 0;

      let status: "healthy" | "cooling" | "dead" = "healthy";
      if (isDead) status = "dead";
      else if (isCooling) status = "cooling";

      result.push({
        alias: entry.alias,
        status,
        cooldownRemainingSeconds: Math.max(0, ttl),
        requestsLastHour: reqCount,
        rateLimitsLastHour: rateLimitCount,
      });
    }

    return result;
  }
}

// Global singleton instance
let poolInstance: GroqKeyPool | null = null;

export function getKeyPool(options?: KeyPoolOptions): GroqKeyPool {
  if (options) return new GroqKeyPool(options);
  if (!poolInstance) {
    poolInstance = new GroqKeyPool();
  }
  return poolInstance;
}
