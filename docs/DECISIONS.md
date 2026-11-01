# PersonaForge — Architecture & Engineering Decisions (ADR)

## DECISION-001: Pure TypeScript Core Package (`@personaforge/core`)
- **Status:** Approved & Implemented (Milestone 1)
- **Context:** PersonaForge prompt compilation, conflict resolution, block validation, and deterministic scoring must be reusable across the Next.js server, the client builder studio, export generators, and offline test runners.
- **Decision:** Built `packages/core` with zero filesystem or network dependencies. Everything runs deterministically in any standard ECMAScript environment.
- **Consequences:** Tests run in milliseconds; exported HTML files can bundle the compiler without heavy runtime shims.

---

## DECISION-002: Groq Key Pool Architecture & Organization Rate Limits
- **Status:** Approved
- **Context:** Prompt specifies key pooling across up to 10 keys from `GROQ_API_KEYS`.
- **Finding:** Groq enforces rate limits (RPM and TPM) at the organization level. If all configured API keys belong to the same Groq organization, generating multiple keys does not increase aggregate token capacity.
- **Decision:** Implement Redis-backed round-robin key selection, exponential backoff cooldowns upon HTTP 429 (`Retry-After` header extraction), short cooldowns for 5xx network errors, and immediate dead-key marking for 401/403 credentials. When all keys are cooling or rate-limited, the system cascades down the `runtime.fallbackModels` chain (e.g., from `llama-3.3-70b-versatile` down to `llama-3.1-8b-instant`). Provide an in-memory mock adapter for local testing and offline execution.

---

## DECISION-003: Single Source of Truth for Voice Capabilities (`VOICE_CAPABILITIES`)
- **Status:** Approved
- **Context:** Sarvam STT and TTS models have evolved (`saarika:v2.5` and `bulbul:v3` supersede older deprecated endpoints). Speaker profiles and languages vary across versions.
- **Decision:** Defined a centralized `VOICE_CAPABILITIES` registry in `@personaforge/core` and exported it to both Next.js routes and the Python WhatsApp gateway. Unsupported controls are hidden rather than faked.

---

## DECISION-004: SSRF Protection for Action & Integration Blocks
- **Status:** Approved
- **Context:** Action blocks allow external HTTP webhook lookups (e.g. order tracking or live mandi rates).
- **Decision:** Enforce allow-listed HTTPS schemes, fixed 5-second timeouts, 100KB payload caps, and strict IP resolution checks blocking RFC 1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.1`), and cloud metadata (`169.254.169.254`). Results are injected strictly as data into the runtime context section, never executed as prompt instructions.

---

## DECISION-005: Standalone Single-File HTML Export Strategy
- **Status:** Approved
- **Context:** PersonaForge must export bots as downloadable `.html` files that run standalone in Hosted mode and BYOK mode.
- **Decision:** All CSS, JavaScript, and SVG icons are inlined directly into a single HTML document. Hosted mode embeds only public metadata (`botId`, `publicToken`, UI theme) and streams from the public API; BYOK mode embeds the compiled prompt and securely stores the user's personal Groq key in browser `localStorage`, with clear privacy notices.

---

## DECISION-006: Server-Sent Events (SSE) Protocol & Voice Sentence Chunking
- **Status:** Approved & Implemented (Milestone 2)
- **Context:** Client preview, standalone embed widgets, and voice bot audio synthesizers require low-latency streaming responses with sentence-level boundaries for real-time TTS audio generation.
- **Decision:** Implemented a unified SSE protocol over HTTP with 5 standard events:
  - `meta`: Carries model information and anonymized key alias (`k1`..`k10`).
  - `token`: Incremental delta text tokens for instant typing animations.
  - `sentence`: Delimited full sentences parsed via `SentenceDetector` on punctuation boundaries (`. `, `! `, `? `, `\n\n`) for direct pipeline feeding to Sarvam TTS.
  - `done`: Usage metrics and finish reason.
  - `error`: User-friendly error message without leaking stack traces or internal secrets.
---

## DECISION-007: WhatsApp Gateway FastAck & Salted Phone Session Hashing
- **Status:** Approved & Implemented (Milestone 6)
- **Context:** Twilio enforces a strict 15-second timeout on incoming webhook responses. Audio transcoding and multi-step voice/vision LLM synthesis can take 4–12 seconds. In addition, privacy regulations prohibit storing unencrypted consumer phone numbers in databases.
- **Decision:** 
  1. The `/webhook` endpoint returns an immediate HTTP 200 FastAck (<50ms) to Twilio and delegates LLM and media synthesis to FastAPI `BackgroundTasks`.
  2. All persistent session storage maps salted phone hashes (`sha256(salt + phone) -> botId`), ensuring consumer phone numbers are used solely in transient memory for outbound delivery.
  3. Outbound messages exceeding 1500 characters are automatically split at sentence boundaries and dispatched with a 1.2-second pacing throttle to satisfy WhatsApp anti-spam rate limits.

