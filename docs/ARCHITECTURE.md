# PersonaForge — System Architecture & Technical Specification

## 1. System Topology Overview

PersonaForge is designed as a modular, production-grade monorepo containing three core components:

```
                                  +---------------------------------------+
                                  |         PersonaForge Studio           |
                                  |        (apps/web - Next.js 15)        |
                                  +---------------------------------------+
                                        /            |             \
                                       /             |              \
             [Hosted Page / Embed.js] /              |               \ [Standalone HTML]
                                     v               v                v
                              +-------------+  +------------+  +-------------------+
                              | Public Chat |  | Groq Pool  |  | BYOK Client Fetch |
                              | Rate Limit  |  | (k1..k10)  |  | (Local Browser)   |
                              +-------------+  +------------+  +-------------------+
                                     |               |
                                     v               v
                        +---------------------------------------+
                        |      @personaforge/core (Pure TS)     |
                        | - 120+ Blocks across 15 Categories    |
                        | - 11-Section Deterministic Compiler   |
                        | - Line-Level Trace Mapping            |
                        | - Conflict Detection & 1-Click Fixes  |
                        | - Deterministic 0-100 Quality Scorer  |
                        | - 12 Industry Domain Templates        |
                        +---------------------------------------+
                                     ^               ^
                                     |               |
             +-----------------------+               +----------------------+
             |                                                              |
+------------------------------------+             +-------------------------------------+
|        Voice Engine Service        |             |      WhatsApp Gateway Service       |
|  - Sarvam STT (saarika:v2.5)       |             |  (services/whatsapp-gateway - Py)   |
|  - Sarvam TTS (bulbul:v3)          |             |  - Twilio Webhook (Async FastAck)   |
|  - Animated VoiceOrb & Barge-In    |             |  - Salted sha256 Phone Session Store|
|  - Sentence-Level Audio Queue      |             |  - Multi-Bot Router (/use <code>)   |
+------------------------------------+             |  - Pillow 1280px Image Downscaler   |
                                                   |  - 1500-char Sentence Chunking     |
                                                   +-------------------------------------+
```

---

## 2. Core Package Architecture (`packages/core`)

### 2.1 Pure TypeScript Guarantee
The core engine enforces a strict zero-I/O boundary:
- No file system (`fs`), network (`fetch`), or process globals.
- Works equivalently in Node.js, V8 Edge runtime, browsers, and WebAssembly workers.
- Instant sub-millisecond execution and deterministic snapshot testing.

### 2.2 Modular Block Registry
PersonaForge organizes bot behavior into 120+ specialized blocks across 15 functional categories:
1. `identity`: Bot name, role definition, persona archetype, avatar, creator bio.
2. `personality`: Empathy, humor, curiosity, assertiveness, optimism.
3. `tone_and_style`: Formal, conversational, technical, warm, direct.
4. `industry_and_domain`: Domain expertise (agriculture, healthcare, retail, SaaS, banking, etc.).
5. `business_context`: Company offerings, refund terms, pricing, operating hours, delivery SLAs.
6. `knowledge`: Grounded FAQs, document citations, retrieval guidelines, ungrounded topic handling.
7. `behaviour`: Clarification protocols, proactive guidance, turn-taking, user frustration handling.
8. `language`: Primary language, bilingual code-switching, translation rules, regional dialects.
9. `output_format`: Markdown, bullet points, JSON schemas, concise limits, step-by-step guides.
10. `rules_and_guardrails`: PII redaction, prompt injection defense, medical disclaimers, financial safety.
11. `actions_and_integrations`: REST webhook lookups (SSRF protected), CRM ticketing, order status.
12. `conversation_and_memory`: Session memory window, context carryover, user profile recall.
13. `voice`: Spoken style rules, pronunciation dictionary, verbal fillers, audio pauses.
14. `model_and_runtime`: Default model, temperature, top_p, fallback model cascade.
15. `channel_overrides`: Channel-specific rules for Web, WhatsApp, and Voice.

### 2.3 Prompt Compilation Pipeline
The compiler translates blocks into an 11-section system prompt:
1. Identity & Role
2. Business Context & Offerings
3. Personality, Tone & Style
4. Language & Localization
5. Knowledge & Grounding Rules
6. Behaviour & Interaction Protocols
7. Output Format & Constraints
8. Rules & Safety Guardrails
9. Actions & Tools
10. Few-Shot Examples
11. Runtime Context & Channel Overrides

**Compiler Features:**
- **Deterministic Ordering**: Sorts blocks by priority and section index.
- **Trace Mapping**: Produces a line-by-line `trace[lineNumber] -> blockId` map for auditability.
- **Token Budget Compaction**: When `maxTokenBudget` is configured, automatically drops lower-priority blocks gracefully with dropped block receipts.
- **Expert Overrides**: Appends custom user prompt rules or selectively replaces generated sections.

### 2.4 Conflict Detection Engine
Detects logical contradictions between blocks (e.g., `output.markdown` vs `voice.spoken_style`, `tone.concise` vs `personality.storyteller`). Provides actionable 1-click `Patch` operations (`action: "remove"` or `action: "set"`).

### 2.5 Deterministic Quality Scorer
Evaluates bot readiness offline across 9 criteria (0–100 score):
- Identity & Role defined
- Grounding & Factuality rules present
- Output formatting specified
- Tone defined
- Channel safety aligned
- Token budget satisfied
- Zero active contradictions
- Voice spoken style valid
- Clean expert overrides

---

## 3. LLM Gateway & Key Pool (`apps/web`)

### 3.1 Zero Secret Leak Guarantee
- Ingests up to 10 Groq keys from `GROQ_API_KEYS`.
- Keys are aliased exclusively as `k1`..`k10` in telemetry, admin dashboards, and logs.
- Never exposed to browser or client bundles.

### 3.2 Resilience & Failover Strategy
- **Round-Robin Cycling**: Distributes request load across keys via Redis counter (`kp:rr`).
- **429 Rate Limit Cooldown**: Parses `Retry-After`, `x-ratelimit-reset-requests`, and `x-ratelimit-reset-tokens` headers; places cooling keys in Redis TTL state.
- **401/403 Dead Key Marking**: Immediately flags revoked or invalid keys and avoids future requests.
- **Model Cascading**: If primary model (`llama-3.3-70b-versatile`) experiences organization rate limits, cascades to fallback models (`llama-3.1-8b-instant`).
- **Exact-Match Cache**: Stateless cache keyed by `sha256(model + messages)`.

### 3.3 Server-Sent Events (SSE) Streaming Protocol
Transmits real-time updates over HTTP:
- `event: meta`: Model and anonymized key alias (`k1`).
- `event: token`: Incremental text tokens for typing rendering.
- `event: sentence`: Complete sentences detected by `SentenceDetector` for direct voice TTS chunking.
- `event: done`: Total token counts and finish reasons.
- `event: error`: User-safe error messages.

---

## 4. Multi-Tenant WhatsApp Gateway (`services/whatsapp-gateway`)

### 4.1 Phone Anonymization & Session Multiplexing
- Phone numbers are hashed using salted SHA-256: `sha256(salt + phone)`.
- Session state stores active bot selection: `/use <code>` updates active bot.
- Commands supported: `/use <code>`, `/bots`, `/reset`, `/lang`, `/help`.

### 4.2 FastAck Webhook Architecture
- Returns HTTP 200 within <50ms to prevent Twilio 15-second webhook timeouts.
- Schedules actual message synthesis asynchronously in FastAPI `BackgroundTasks`.

### 4.3 Security & Signal Hardening
- **Signature Validation**: Validates `X-Twilio-Signature` using `twilio.request_validator.RequestValidator`.
- **Image Downscaling**: Downscales incoming photos with Pillow to max 1280x1280 before LLM vision processing.
- **Message Chunking & Throttling**: Splits messages exceeding 1500 characters on sentence boundaries and spaces chunks by ~1.2s to respect WhatsApp messaging rate limits.
- **Audio Serving Protection**: Audio route `/audio/{filename}` enforces UUID regex validation and purges temporary files after 5 minutes.

---

## 5. Deployment & Export Matrix

| Target | Architecture | Privacy Guarantee |
| :--- | :--- | :--- |
| **Hosted Page (`/b/[slug]`)** | Next.js Server App Router | Rate-limited public API, zero prompt/key exposure |
| **Embed Widget (`/embed.js`)** | Lightweight client injector | Floating glassmorphism launcher, connects to public API |
| **Standalone HTML (Hosted)** | Zero-dependency single file | Connects to platform API via secure token |
| **Standalone HTML (BYOK)** | Zero-dependency single file | Inlines prompt; client communicates directly with Groq |
| **WhatsApp Sandbox** | FastAPI Multi-Tenant Gateway | Salted session hashing, shared sandbox number |
