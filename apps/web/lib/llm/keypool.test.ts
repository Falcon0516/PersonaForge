import { describe, it, expect, beforeEach } from "vitest";
import { GroqKeyPool } from "./keypool";
import { createMemoryRedis } from "../redis/client";

describe("GroqKeyPool", () => {
  let redis: ReturnType<typeof createMemoryRedis>;
  let pool: GroqKeyPool;

  beforeEach(() => {
    redis = createMemoryRedis();
    pool = new GroqKeyPool({
      redis,
      customKeys: ["gsk_test_key_1", "gsk_test_key_2", "gsk_test_key_3"],
      defaultCooldownSec: 45,
    });
  });

  it("initializes key pool with alias mapping up to 10 keys without exposing secrets in aliases", () => {
    expect(pool.getKeyCount()).toBe(3);
    const keys = pool.getKeys();
    expect(keys).toEqual([
      { alias: "k1", index: 1 },
      { alias: "k2", index: 2 },
      { alias: "k3", index: 3 },
    ]);
  });

  it("rotates keys in round-robin order", async () => {
    const kA = await pool.getNextKey();
    const kB = await pool.getNextKey();
    const kC = await pool.getNextKey();
    const kD = await pool.getNextKey();

    expect(kA?.alias).toBe("k2"); // initial incr -> 1 % 3 = 1 -> index 2
    expect(kB?.alias).toBe("k3");
    expect(kC?.alias).toBe("k1");
    expect(kD?.alias).toBe("k2");
  });

  it("handles key cooling upon 429 rate limit", async () => {
    // Put k2 into cooldown
    await pool.setKeyCooldown(2, 60, "Rate limited");

    expect(await pool.isKeyCooling(2)).toBe(true);
    expect(await pool.getCooldownTtl(2)).toBeGreaterThan(0);

    // Round-robin should skip k2
    const next1 = await pool.getNextKey();
    const next2 = await pool.getNextKey();

    expect(next1?.alias).not.toBe("k2");
    expect(next2?.alias).not.toBe("k2");
  });

  it("marks key dead upon 401/403 invalid key", async () => {
    await pool.markKeyDead(1, "HTTP 401 Invalid Key");

    expect(await pool.isKeyDead(1)).toBe(true);

    // Multiple calls should never return k1
    const picked = new Set<string>();
    for (let i = 0; i < 6; i++) {
      const k = await pool.getNextKey();
      if (k) picked.add(k.alias);
    }

    expect(picked.has("k1")).toBe(false);
    expect(picked.has("k2")).toBe(true);
    expect(picked.has("k3")).toBe(true);
  });

  it("finds soonest recovery key when all keys are cooling", async () => {
    await pool.setKeyCooldown(1, 120);
    await pool.setKeyCooldown(2, 20); // soonest
    await pool.setKeyCooldown(3, 90);

    const next = await pool.getNextKey();
    expect(next).toBeNull();

    const soonest = await pool.getSoonestRecovery();
    expect(soonest).not.toBeNull();
    expect(soonest?.key.alias).toBe("k2");
    expect(soonest?.remainingSec).toBeLessThanOrEqual(20);
  });

  it("parses retry-after headers correctly", () => {
    const headers1 = new Headers({ "retry-after": "42" });
    expect(pool.parseRetryAfter(headers1)).toBe(42);

    const headers2 = new Headers({ "x-ratelimit-reset-requests": "15.4" });
    expect(pool.parseRetryAfter(headers2)).toBe(16);

    const headers3 = new Headers();
    expect(pool.parseRetryAfter(headers3)).toBe(45); // defaultCooldownSec
  });

  it("caches responses by exact-match prompt hash", async () => {
    const messages = [
      { role: "system", content: "You are helpful." },
      { role: "user", content: "Hello!" },
    ];
    const cacheKey = pool.computeCacheKey("llama-3.3-70b-versatile", messages);

    expect(await pool.getCachedResponse(cacheKey)).toBeNull();

    await pool.setCachedResponse(cacheKey, "Cached reply!", 100);
    expect(await pool.getCachedResponse(cacheKey)).toBe("Cached reply!");
  });

  it("reports key status without leaking secrets", async () => {
    await pool.recordRequest(1, false);
    await pool.recordRequest(1, true);
    await pool.setKeyCooldown(1, 30);
    await pool.markKeyDead(3, "Revoked");

    const statuses = await pool.getStatus();
    expect(statuses).toHaveLength(3);

    const k1 = statuses.find((s) => s.alias === "k1");
    const k2 = statuses.find((s) => s.alias === "k2");
    const k3 = statuses.find((s) => s.alias === "k3");

    expect(k1?.status).toBe("cooling");
    expect(k1?.requestsLastHour).toBe(2);
    expect(k1?.rateLimitsLastHour).toBe(1);

    expect(k2?.status).toBe("healthy");
    expect(k3?.status).toBe("dead");

    // Make sure secret key values are never in status object
    const serialized = JSON.stringify(statuses);
    expect(serialized).not.toContain("gsk_test");
  });
});
