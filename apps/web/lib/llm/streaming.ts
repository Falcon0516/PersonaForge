import { GroqKeyPool, getKeyPool } from "./keypool";

export type MessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
  image?: string;
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  pool?: GroqKeyPool;
  signal?: AbortSignal;
}

export interface StreamEvent {
  event: "meta" | "token" | "sentence" | "done" | "error";
  data: Record<string, unknown>;
}

export class SentenceDetector {
  private buffer = "";
  private readonly sentenceEndRegex = /([.!?]+["')\]]?\s+|\n\n+)/;

  push(text: string): string[] {
    this.buffer += text;
    const sentences: string[] = [];

    while (true) {
      const match = this.sentenceEndRegex.exec(this.buffer);
      if (!match) break;

      const splitIndex = match.index + match[0].length;
      const sentence = this.buffer.slice(0, splitIndex).trim();
      if (sentence) {
        sentences.push(sentence);
      }
      this.buffer = this.buffer.slice(splitIndex);
    }

    return sentences;
  }

  flush(): string[] {
    const remaining = this.buffer.trim();
    this.buffer = "";
    return remaining ? [remaining] : [];
  }
}

export async function* streamChat(options: StreamChatOptions): AsyncGenerator<StreamEvent, void, unknown> {
  const pool = options.pool || getKeyPool();
  const maxAttempts = 4;
  let activeModel = options.model || process.env.GROQ_DEFAULT_MODEL || "qwen/qwen3.8-27b";
  if (activeModel.startsWith("llama-3")) {
    activeModel = "qwen/qwen3.8-27b";
  }

  // Detect image in conversation to auto-switch to Qwen 27B Vision
  const hasImage = options.messages.some(
    (m) => !!m.image || (Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url"))
  );
  if (hasImage) {
    activeModel = "qwen/qwen3.8-27b";
  }

  const fallbackModel = "qwen/qwen3.8-27b";

  // Prepare messages with image_url formatting if needed
  const groqMessages = options.messages.map((m) => {
    if (m.image) {
      return {
        role: m.role,
        content: [
          { type: "image_url", image_url: { url: m.image } },
          {
            type: "text",
            text:
              typeof m.content === "string" && m.content.trim()
                ? m.content
                : "Analyze this image and describe what you see.",
          },
        ],
      };
    }
    return {
      role: m.role,
      content: m.content,
    };
  });

  let response: Response | null = null;
  let usedKeyAlias = "";
  let attempt = 0;

  while (attempt < maxAttempts) {
    if (options.signal?.aborted) {
      yield { event: "error", data: { message: "Request aborted by client" } };
      return;
    }

    let keyEntry = await pool.getNextKey();

    // If all keys are cooling or dead, attempt fallback model if not already on fallback
    if (!keyEntry) {
      if (activeModel !== fallbackModel) {
        activeModel = fallbackModel;
        keyEntry = await pool.getNextKey();
      }
    }

    if (!keyEntry) {
      const soonest = await pool.getSoonestRecovery();
      const waitMsg = soonest
        ? `All keys currently cooling. Soonest key recovers in ${soonest.remainingSec}s.`
        : "No active API keys available in the pool.";
      yield { event: "error", data: { message: waitMsg } };
      return;
    }

    usedKeyAlias = keyEntry.alias;
    await pool.recordRequest(keyEntry.index, false);

    try {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${keyEntry.key}`,
        },
        body: JSON.stringify({
          model: activeModel,
          messages: groqMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1024,
          stream: true,
        }),
        signal: options.signal,
      });

      if (response.status === 429) {
        const retryAfter = pool.parseRetryAfter(response.headers);
        await pool.recordRequest(keyEntry.index, true);
        await pool.setKeyCooldown(keyEntry.index, retryAfter, "429 Rate Limit");
        attempt++;
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        await pool.markKeyDead(keyEntry.index, `HTTP ${response.status} Invalid Key`);
        attempt++;
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 404 || errText.includes("does not exist") || errText.includes("model_not_found")) {
          if (activeModel !== fallbackModel) {
            activeModel = fallbackModel;
            attempt++;
            continue;
          }
        }
        attempt++;
        if (attempt >= maxAttempts) {
          yield {
            event: "error",
            data: { message: `Groq API error (${response.status}): ${errText.slice(0, 150)}` },
          };
          return;
        }
        continue;
      }

      // Successful connection established
      break;
    } catch (err: unknown) {
      if (options.signal?.aborted) {
        yield { event: "error", data: { message: "Request aborted" } };
        return;
      }
      attempt++;
      if (attempt >= maxAttempts) {
        yield { event: "error", data: { message: `Network error: ${String(err)}` } };
        return;
      }
    }
  }

  if (!response || !response.ok || !response.body) {
    yield { event: "error", data: { message: "Failed to establish stream after multiple attempts" } };
    return;
  }

  yield {
    event: "meta",
    data: {
      model: activeModel,
      keyAlias: usedKeyAlias,
    },
  };

  const sentenceDetector = new SentenceDetector();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let totalTokens = 0;
  let finishReason = "stop";

  try {
    while (true) {
      if (options.signal?.aborted) {
        await reader.cancel();
        return;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;

        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(dataStr);
          const choice = parsed.choices?.[0];
          const deltaContent = choice?.delta?.content;
          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }

          if (deltaContent) {
            totalTokens += 1;
            yield { event: "token", data: { text: deltaContent } };

            const completedSentences = sentenceDetector.push(deltaContent);
            for (const sentence of completedSentences) {
              yield { event: "sentence", data: { sentence } };
            }
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    // Flush any remaining sentence fragment
    const remainingSentences = sentenceDetector.flush();
    for (const sentence of remainingSentences) {
      yield { event: "sentence", data: { sentence } };
    }

    yield {
      event: "done",
      data: {
        totalTokens,
        finishReason,
      },
    };
  } finally {
    reader.releaseLock();
  }
}

export function formatSSE(event: StreamEvent): string {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

export function createSSEStreamResponse(
  options: StreamChatOptions,
  init?: ResponseInit
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamChat(options)) {
          controller.enqueue(encoder.encode(formatSSE(event)));
          if (event.event === "error" || event.event === "done") {
            break;
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            formatSSE({
              event: "error",
              data: { message: `Internal stream error: ${String(err)}` },
            })
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...(init?.headers || {}),
    },
  });
}
