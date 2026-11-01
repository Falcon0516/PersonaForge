import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SentenceDetector, streamChat, createSSEStreamResponse } from "./streaming";
import { GroqKeyPool } from "./keypool";
import { createMemoryRedis } from "../redis/client";

describe("SentenceDetector", () => {
  it("detects sentences separated by periods, exclamation marks, question marks, and line breaks", () => {
    const detector = new SentenceDetector();

    const s1 = detector.push("Hello there! How are ");
    expect(s1).toEqual(["Hello there!"]);

    const s2 = detector.push("you doing today? I am fine.");
    expect(s2).toEqual(["How are you doing today?"]);

    const remaining = detector.flush();
    expect(remaining).toEqual(["I am fine."]);
  });

  it("handles double newlines as sentence breaks", () => {
    const detector = new SentenceDetector();
    const s1 = detector.push("First thought.\n\nSecond thought without punctuation");
    expect(s1).toEqual(["First thought."]);

    const remaining = detector.flush();
    expect(remaining).toEqual(["Second thought without punctuation"]);
  });
});

describe("streamChat & SSE Response", () => {
  let redis: ReturnType<typeof createMemoryRedis>;
  let pool: GroqKeyPool;

  beforeEach(() => {
    redis = createMemoryRedis();
    pool = new GroqKeyPool({
      redis,
      customKeys: ["test_key_1", "test_key_2"],
      defaultCooldownSec: 10,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("yields meta, tokens, sentences, and done events from SSE stream", async () => {
    const mockSSEStream =
      'data: {"choices":[{"delta":{"content":"Namaste! "}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":"How can I assist you with your crops?"}}]}\n\n' +
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n' +
      "data: [DONE]\n\n";

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(mockSSEStream));
        controller.close();
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: stream,
      })
    );

    const events: any[] = [];
    for await (const ev of streamChat({
      messages: [{ role: "user", content: "Hi" }],
      pool,
    })) {
      events.push(ev);
    }

    expect(events.some((e) => e.event === "meta")).toBe(true);
    expect(events.some((e) => e.event === "token" && e.data.text === "Namaste! ")).toBe(true);
    expect(events.some((e) => e.event === "sentence" && e.data.sentence === "Namaste!")).toBe(true);
    expect(events.some((e) => e.event === "done")).toBe(true);
  });

  it("handles 429 rate limit failover to second key", async () => {
    const mockSuccessSSE =
      'data: {"choices":[{"delta":{"content":"Success after failover!"}}]}\n\n' +
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}\n\n' +
      "data: [DONE]\n\n";

    const encoder = new TextEncoder();
    const successStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(mockSuccessSSE));
        controller.close();
      },
    });

    const mockFetch = vi
      .fn()
      // First attempt: 429
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "5" }),
        text: async () => "Rate limit exceeded",
      })
      // Second attempt: 200 success
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: successStream,
      });

    vi.stubGlobal("fetch", mockFetch);

    const events: any[] = [];
    for await (const ev of streamChat({
      messages: [{ role: "user", content: "Hi" }],
      pool,
    })) {
      events.push(ev);
    }

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(events.some((e) => e.event === "token" && e.data.text === "Success after failover!")).toBe(true);
    expect(events.some((e) => e.event === "done")).toBe(true);
  });

  it("creates an SSE Response object with proper headers", async () => {
    const mockSSEStream = 'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(mockSSEStream));
        controller.close();
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        body: stream,
      })
    );

    const response = createSSEStreamResponse({
      messages: [{ role: "user", content: "Hi" }],
      pool,
    });

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(response.headers.get("Cache-Control")).toContain("no-cache");

    const text = await response.text();
    expect(text).toContain("event: meta");
    expect(text).toContain("event: token");
    expect(text).toContain("event: done");
  });
});
