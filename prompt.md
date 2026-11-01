# Build Brief for the AI Coding Agent: PersonaForge

You are a senior full-stack engineer. Build **PersonaForge**, a no-code studio where non-programmers assemble an AI chatbot or voice bot from drag-and-drop blocks, see the system prompt compile live, customise the chat UI, and publish the result as a hosted page, an embeddable widget, a downloadable `.html` file, and a WhatsApp bot.

Read **all** of this brief first. Then work milestone by milestone (section 14), committing after each one. Read `PROJECT.md` in the repo root for the product narrative. This file is the engineering contract.

---

## 0. Ground rules

1. **Plan before code.** First action: inspect the workspace, then write `docs/PLAN.md` (milestones, risks, open questions). Then proceed without waiting, unless something is genuinely blocking.
2. **Never guess external API details.** For Groq, Sarvam, Twilio, Supabase and Upstash, consult the official docs (links in section 15). Put every model name, speaker name, and language list in configuration, never scattered through code.
3. **No secrets in code, logs, git, the browser, or exported files.** `.env`, `venv/`, `.venv/`, `node_modules/`, `__pycache__/` go in `.gitignore` immediately. Provide `.env.example` files with placeholders only. Never print a key; refer to keys by alias (`k1`..`k10`).
4. **Prefer boring, tested solutions** over clever ones. Every non-trivial module gets tests.
5. **Accessibility and polish are requirements,** not extras (section 9).
6. **Report honestly.** If something cannot work as specified (for example a vendor limit), implement the closest safe behaviour, document it in `docs/DECISIONS.md`, and say so in your final report.
7. **Do not rewrite the existing WhatsApp code from scratch.** Refactor it (section 8).

---

## 1. Existing asset: `whatsapp_feature/` (Python)

A working service already exists in the workspace. **Read `README.md`, `setup.md`, `ai_services.py`, `whatsapp_handler.py`, `requirements.txt` before designing anything.** Do not open or print `.env`.

### 1.1 What it does today (preserve these behaviours)
- `POST /webhook` receives Twilio form fields (`From`, `Body`, `NumMedia`, `MediaUrl0`, `MediaContentType0`) and routes to text, image, or voice handlers.
- **Text:** detect language, build context, Groq chat completion, reply via Twilio.
- **Image:** download Twilio media (basic auth), base64 encode, Groq Vision, reply.
- **Voice:** download audio, Sarvam STT, detect language, Groq reply, send text (with the transcript shown), Sarvam TTS, convert WAV to AAC/MP4 (`afconvert` on macOS, `ffmpeg` elsewhere), serve from `GET /audio/{file}`, send as media.
- `GET /health`.
- `ai_services.py` has **no FastAPI imports** and is independently testable. Keep that property.
- Integration hooks (`get_farmer_profile`, `get_farmer_orders`, `get_market_prices`, `create_produce_listing`) are stubs. They generalise into the **Actions and integrations** blocks (section 5).

### 1.2 Known problems you must fix during the refactor
| # | Problem | Required fix |
|---|---|---|
| 1 | Persona is hard-coded (`SYSTEM_PROMPT_TEMPLATE`, "KisanMitra") | Persona and runtime settings come from a bot configuration fetched from the platform |
| 2 | Sessions are an in-memory dict | Redis-backed sessions with TTL; same schema |
| 3 | Sync `requests` / sync Groq client called inside `async def` handlers (blocks the event loop) | Use `httpx.AsyncClient` or `asyncio.to_thread` / `run_in_threadpool` |
| 4 | Webhook does all work before returning; Twilio times out on slow requests (voice pipeline is slow) | Validate, **return 200 immediately**, process in a background task |
| 5 | No `X-Twilio-Signature` validation | Validate with `twilio.request_validator.RequestValidator` using the public base URL; reject invalid requests (allow bypass only via an explicit `DEV_SKIP_SIGNATURE=true`) |
| 6 | Language detection costs an extra LLM call per message and supports only en/hi/kn | Detect by Unicode script first, call an LLM or Sarvam language identification only when ambiguous; supported languages come from the bot config and a central language table |
| 7 | README lists `saarika:v2` / `bulbul:v1`; code uses `saarika:v2.5` / `bulbul:v3` (the older names are deprecated by Sarvam) | Single source of truth in config; fix the docs |
| 8 | `/audio/{filename}` serves files with no filename validation and temp files are never cleaned | Validate against `^[a-f0-9]{32}\.(wav|mp4)$`, add TTL cleanup task, size cap |
| 9 | Text then audio sent back-to-back; sandbox allows ~1 message per 3 s | Small send throttle/queue per recipient |
| 10 | Long replies | Split at sentence boundaries to stay under WhatsApp's per-message body limit (use a conservative 1,500 characters) |
| 11 | Fallback strings only in en/hi/kn | Generic fallback table keyed by language, default English |
| 12 | `.env`, `venv/`, `.venv/` were bundled with the code | Add `.gitignore`; confirm none are tracked |
| 13 | Phone numbers logged in full | Mask in logs (`whatsapp:+91******1234`) |

Keep the module split: `ai_services.py` (pure service calls), `whatsapp_handler.py` (transport). You may add modules (`sessions.py`, `platform_client.py`, `audio.py`, `languages.py`, `commands.py`).

---

## 2. Product requirements (summary)

**Modes:** Chat bot and Voice bot, both configured in one builder.
**Outputs:** hosted page `/b/[slug]`, embed widget `/embed.js`, downloadable `.html` (hosted mode and BYOK mode), WhatsApp via Twilio sandbox.
**Industries:** ship templates for business support, e-commerce, education, tech helpdesk, agriculture (port of KisanMitra), healthcare front desk (non-diagnostic), finance FAQ, HR, travel, real estate, government services, and creative/character bots.
**Scale of configuration:** at least **120 shipped parameters** across 15 categories (section 5), implemented as registry data, so adding more never requires new UI code.

---

## 3. Repository layout and tooling

```
personaforge/
├─ apps/web/                      # Next.js 15, App Router, TypeScript
├─ packages/core/                 # zod schemas, block registry, compiler, conflicts, scoring (pure TS, no I/O)
├─ services/whatsapp-gateway/     # refactored whatsapp_feature (Python 3.11+, FastAPI)
├─ docs/                          # PLAN.md, DECISIONS.md, ARCHITECTURE.md, RUNBOOK.md, DEMO.md
├─ .github/workflows/ci.yml
├─ .gitignore  .editorconfig  README.md  PROJECT.md  prompt.md
└─ pnpm-workspace.yaml
```

- **Package manager:** pnpm workspaces. Node 20+. Python 3.11+.
- **Web:** Next.js 15 (App Router), TypeScript strict, Tailwind, shadcn/ui, `@dnd-kit/core` + `@dnd-kit/sortable`, Zustand (with `zundo` or an equivalent for undo/redo), Framer Motion, Recharts, Zod, `react-markdown` + `rehype-sanitize`, `qrcode`.
- **Data:** Supabase (Postgres, Auth, Storage, pgvector). Use SQL migrations in `apps/web/supabase/migrations/` with Row Level Security on every table.
- **Cache / limits:** Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`).
- **Tests:** Vitest (core + API logic), Playwright (builder and export smoke tests), pytest (gateway).
- **Lint/format:** ESLint, Prettier, Ruff.
- **CI:** typecheck, lint, unit tests, build; on every push.

---

## 4. Core package (`packages/core`): build this first

Pure TypeScript. No network, no filesystem. It is imported by the web app, the exporter, and the tests.

### 4.1 Schemas (Zod)
```ts
export const Channel = z.enum(["web", "voice", "whatsapp"]);
export const BotMode = z.enum(["chat", "voice"]);

export const BotConfig = z.object({
  schemaVersion: z.literal(1),
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]{3,40}$/),
  name: z.string().min(1).max(60),
  mode: BotMode,
  industry: z.string(),
  blocks: z.record(z.string(), z.unknown()),   // blockId -> value (validated against the registry)
  blockOrder: z.array(z.string()).optional(),  // user ordering inside a section
  expert: z.object({
    append: z.string().max(4000).optional(),   // appended to the compiled prompt
    replace: z.string().max(12000).nullable().optional() // full override (disables compiler, shows warning)
  }).default({}),
  runtime: z.object({
    model: z.string(), fallbackModels: z.array(z.string()),
    temperature: z.number().min(0).max(2), topP: z.number().min(0).max(1).optional(),
    maxTokens: z.number().int().min(64).max(4096),
    memory: z.enum(["none", "session", "summary"]), memoryWindow: z.number().int().min(2).max(40),
    cache: z.boolean(), moderation: z.enum(["off", "standard", "strict"])
  }),
  ui: UIConfig,            // theme, colours, font, bubble style, avatar, greeting, chips, launcher, orb style...
  voice: VoiceConfig.optional(),   // speaker, pace, language, handsFree, bargeIn, captions...
  channels: z.object({
    web: z.object({ enabled: z.boolean() }),
    whatsapp: z.object({ enabled: z.boolean(), replyCharCap: z.number().int().optional(), voiceNoteReplies: z.boolean(), imageUnderstanding: z.boolean() })
  })
});
```
Add `UIConfig`, `VoiceConfig`, `PublicBot` (the client-safe subset: **never includes the compiled prompt**) and `ExportManifest`.

### 4.2 Block definition
```ts
export type BlockDef<V = unknown> = {
  id: string;                       // "tone.preset"
  category: CategoryId;             // one of the 15 categories
  section: PromptSectionId;         // where its fragment lands (section 4.3)
  label: string; description: string; icon: string;
  kind: "select"|"multiselect"|"slider"|"toggle"|"text"|"textarea"|"list"|"keyvalue"|"faq"|"file"|"color";
  schema: z.ZodType<V>; default: V;
  options?: { value: string; label: string; hint?: string }[];
  modes: BotMode[];                 // chat, voice, or both
  channels: Channel[];
  industries?: string[];            // for filtering and template relevance
  priority: number;                 // ordering inside a section
  render: (value: V, ctx: CompileContext) => string | null;   // PURE; null = emit nothing
  conflicts?: { with: string; when?: (a: V, b: unknown) => boolean; message: string; fix?: Patch }[];
  requires?: string[];
};
```
Rules: `render` must be pure and deterministic; every block has a unit test asserting its fragment appears (or not) for representative values; the registry is validated at startup (unique ids, valid sections, defaults pass their own schema).

### 4.3 Compiler
`compile(config, { channel, runtime }) → { prompt, sections, trace, tokenEstimate, warnings }`
- Fixed section order: **Identity, Business context, Personality and tone, Language, Knowledge rules, Behaviour, Output format, Guardrails, Actions, Examples, Runtime context.**
- `trace` maps each output line to the block id that produced it (powers "why is this line here?" in the UI).
- Channel-aware rendering (for example: `whatsapp` adds a character cap and "no markdown headings"; `voice` adds spoken-style rules).
- Token estimate (simple, documented heuristic; no tokenizer dependency required) and a **compaction pass** that drops lowest-priority fragments when over budget, reporting what was dropped.
- `expert.replace` bypasses the compiler and emits a warning; `expert.append` goes last.
- **Snapshot tests** for at least 10 reference configs.

### 4.4 Conflict engine and quality score
- `detectConflicts(config) → Conflict[]` with a suggested one-click `fix` patch (for example *Formal* + *Gen-Z slang*, *Answer only from knowledge* with empty knowledge, *Voice bot* with markdown enabled).
- `scorePrompt(config) → { score: 0-100, checks: Check[] }` using **deterministic checks** (has role, has guardrails, has fallback for unknown answers, language rule present, length sanity, no contradictory instructions). A separate server route may add an LLM-judge pass; the deterministic score must work offline.

### 4.5 Templates
`templates/*.ts`: typed `BotConfig` presets with name, industry, description, preview chips, and sample conversation starters. Include the 12 industries listed in section 2. The **Agriculture Advisor** template is a faithful port of the KisanMitra prompt rules (short, simple, warm, honorific by language, actionable).

---

## 5. Block library: at least 120 blocks

Implement as data in `packages/core/src/blocks/<category>.ts`. Counts are targets; quality matters more than hitting the exact number, but ship **no fewer than 120**, each with a real, distinct effect on the prompt.

| Category | Target | Examples (not exhaustive) |
|---|---|---|
| Identity | 10 | name, role/title, organization, tagline, backstory, archetype, catchphrase, sign-off, pronouns, avatar |
| Personality | 12 | warmth, humour, sarcasm, empathy, confidence, curiosity, patience, formality, enthusiasm, directness, creativity, assertiveness |
| Tone and style | 10 | tone preset, vocabulary level, sentence length, jargon level, metaphors, storytelling, slang, honorifics (sir/madam, anna, bhai), emoji usage, cultural flavour |
| Industry and domain | 8 | industry, sub-domain, expertise level, audience, region, regulatory context, glossary, competitor policy |
| Business context | 12 | company description, products/services, pricing policy, business hours, contact details, refund/shipping policy, locations, escalation rules, brand do/don't, upsell behaviour, promotions, SLA wording |
| Knowledge | 8 | knowledge text, FAQ pairs, document upload, URL ingest, "answer only from knowledge", citation style, unknown-answer behaviour, freshness note |
| Behaviour | 14 | reply length, follow-up questions, proactive suggestions, clarify ambiguity, step-by-step, summary at end, confirm understanding, next-action offers, greeting, farewell, small-talk allowance, humour allowance, refusal style, persistence |
| Language | 8 | primary language, allowed languages, mirror user language, code-mixing, script preference, translate on request, per-language formality, number/currency format (INR, lakh/crore) |
| Output format | 8 | markdown, bullets, tables, headings, code blocks, max characters, JSON mode, link formatting |
| Rules and guardrails | 12 | never-say list, forbidden topics, off-topic redirect, age gate, medical/legal/financial disclaimers, PII handling, no-hallucination policy, source-required, prompt-leak protection, jailbreak resistance, profanity filter, political neutrality |
| Actions and integrations | 10 | lead capture, booking link, human handoff, REST lookup (generalised KisanMitra hooks), email notify, calendar link, order status lookup, payment link, sheet/CSV log, keyword escalation triggers |
| Conversation and memory | 6 | memory mode, window size, summarisation, user-profile fields, session timeout, returning-user greeting |
| Voice (voice mode only) | 12 | speaker, pace, language, hands-free vs push-to-talk, barge-in, silence timeout, filler phrases, spoken-style rewriting, captions, greeting line, number/date speaking style, interruption policy |
| Model and runtime | 8 | model, fallback chain, temperature, top-p, max tokens, streaming, cache, moderation level |
| Channel overrides | 6 | WhatsApp length cap, WhatsApp emoji style, voice-note replies, image understanding, slash-command help text, per-channel greeting |

**Voice parameters are capability-driven:** a `VOICE_CAPABILITIES` config declares which Sarvam TTS options exist per model version (speaker lists differ between model versions; unsupported controls are hidden, not faked).

**Actions and integrations** must be safe: outbound REST lookups use an allow-listed URL, fixed timeouts, response size caps, and **block private/internal IP ranges (SSRF protection)**. Results are injected into the runtime-context section as data, never as instructions.

---

## 6. Web app (`apps/web`)

### 6.1 Pages
| Route | Purpose |
|---|---|
| `/` | Landing page with live mini-demo and industry gallery |
| `/login` | Supabase Auth (email magic link and Google) |
| `/dashboard` | My bots (cards with status, channel badges, last edited), create new, duplicate, delete |
| `/builder/[id]` | The studio (section 6.2) |
| `/builder/[id]/publish` | Channel tabs: Hosted, Embed, Download HTML, WhatsApp |
| `/builder/[id]/analytics` | Charts and tables |
| `/gallery` | Public templates and community bots; "Use this template" |
| `/b/[slug]` | Public hosted bot (chat and voice), themed per bot, SEO and social metadata |
| `/admin/keys` | Key-pool health (admin role only) |
| `/embed.js` | Widget loader (served as a route handler) |

### 6.2 Builder studio
Three panes, resizable, remembering layout. Collapsible on tablets; on phones, a tabbed layout (Blocks, Canvas, Preview).

- **Left: palette.** Search, category tabs, industry filter, "recently used", block cards with icon and one-line description. Drag or click to add. Disabled-with-reason for blocks incompatible with the current mode.
- **Centre: canvas.** Sections in compile order; blocks sortable within a section (dnd-kit, keyboard-accessible drag with announcements). Each block card expands to an inline editor appropriate to its `kind`. Show a live **conflict badge** with a one-click fix. Per-block "why does this exist?" popover using compiler `trace`.
- **Right: tabs.**
  1. **Preview**: real streaming chat (or voice) against the draft configuration, with a *Reset* button and a channel switcher (Web / WhatsApp-style / Voice) that changes how the compiler renders.
  2. **Prompt**: the compiled prompt with section headers, line-to-block highlighting, token estimate, copy button, *Expert mode* editor for `append` / `replace` with a clear warning.
  3. **Score**: quality score ring plus actionable checks.
  4. **A/B**: pick two saved versions, run a shared list of test questions, show answers side by side with latency, allow marking a winner.
- **Top bar:** bot name, autosave state, undo/redo, version history drawer (restore any version), *Describe your bot* magic box, Randomize/Remix, Publish.
- **Magic box:** `POST /api/bots/generate` sends the sentence plus the registry's **machine-readable catalogue** (id, kind, options) to the LLM in JSON mode; the response is validated against the registry schemas; invalid entries are dropped and reported. The LLM can only pick registry blocks, never invent them.
- **Command palette** (`Ctrl/Cmd+K`): add block, jump to category, run test, publish, switch theme. **Onboarding tour** on first visit.
- **Autosave** with debounce and optimistic concurrency (`version` column; show a conflict dialog if another tab saved).

### 6.3 Chat UI customiser (also used by hosted page, widget, and export)
Implement the chat UI as **one framework-agnostic renderer** that can run in React (app) and be serialised into a standalone script (export/widget), so all surfaces look identical. Configurable: theme (light/dark/auto), primary/accent/surface colours, font family (system and a small curated Google Fonts list), bubble shape and density, avatar, header title/subtitle, background (solid, gradient, or uploaded image), greeting, suggested-reply chips, typing indicator style, launcher icon and position (widget), "powered by" toggle, timestamps, message feedback (thumbs), copy button, markdown rendering (sanitised). **Live preview** with desktop and mobile frames. Contrast checker warns on inaccessible colour pairs.

### 6.4 Design direction
Create a distinctive, modern "studio" look: calm neutral surfaces, one confident accent, generous spacing, crisp type, subtle motion (Framer Motion, respect `prefers-reduced-motion`), and polished empty, loading, and error states. Avoid generic template aesthetics. Define design tokens (CSS variables) for light and dark themes. The builder must feel fast: no layout shift when dragging, skeletons instead of spinners, optimistic UI.

---

## 7. Backend (Next.js Route Handlers, Node runtime)

### 7.1 Routes
| Route | Auth | Notes |
|---|---|---|
| `POST /api/preview/chat` | user session | Streams SSE for the builder preview using the draft config (not yet published) |
| `POST /api/public/bots/[id]/chat` | public token | Streams SSE; the hosted page, widget, and exported HTML all use this |
| `POST /api/public/bots/[id]/stt` | public token | Short audio in, transcript and detected language out |
| `POST /api/public/bots/[id]/tts` | public token | Text in, audio out (one sentence per call) |
| `POST /api/bots/generate` | user | Magic box |
| `POST /api/bots/[id]/score` | user | Deterministic score plus optional LLM-judge |
| `POST /api/bots/[id]/knowledge` | user | Upload text/PDF/URL, chunk, embed, store |
| `POST /api/bots/[id]/export/html` | user | `?mode=hosted|byok` returns the standalone file |
| `POST /api/bots/[id]/whatsapp/code` | user | Creates/rotates the short bot code used by `/use <code>` |
| `POST /api/internal/respond` | shared secret | Called by the WhatsApp gateway (section 8) |
| `GET  /api/admin/keys` | admin | Key-pool health, aliases only |
| `GET/POST /api/analytics/*` | user | Aggregations and CSV export |

### 7.2 Streaming protocol (SSE)
Events: `meta` (conversation id), `token` (text delta), `sentence` (complete sentence, voice mode only), `done` (usage, latency, finish reason), `error` (stable error code and a user-safe message). Clients must handle reconnect-free cancellation (`AbortController`).

### 7.3 Groq key pool (`apps/web/lib/llm/keypool.ts`)
- Keys from `GROQ_API_KEYS` (comma-separated, up to 10); **alias by position** and never log values.
- State in **Redis**, not memory: `kp:cool:{i}` (TTL = cooldown), `kp:rr` (round-robin counter), `kp:stats:{i}:{hour}` (counters), `kp:dead:{i}`.
- Algorithm: pick next non-cooling key round-robin; on `429` set cooldown from `retry-after` (fallback to rate-limit reset headers, then a default), retry on the next key; on `5xx`/network error short cooldown; on `401/403` mark dead and surface an alert in `/admin/keys`.
- Max attempts per request = number of healthy keys (cap 4). If all cooling: walk `runtime.fallbackModels`, then wait up to a small bounded time for the soonest key, then return a friendly error.
- Streaming: fail over **only before the first token** has been sent to the client.
- Optional exact-match cache (`sha256(model + prompt + last N messages)`, TTL configurable) only for bots with `cache: true` and `memory: "none"`.
- **Unit tests with a mocked fetch** covering: round-robin order, 429 failover, all-keys-cooling fallback, dead key handling, and cooldown expiry.
- Model list and defaults come from config; add an admin action that lists models available to the keys (so stale model names are discovered quickly).
- Document in `docs/DECISIONS.md` that Groq limits are generally per organisation, so multiple keys from one account may not increase capacity.

### 7.4 Public API protection
- Public token per bot (random, shown once, stored as a hash, rotatable/revocable).
- `Access-Control-Allow-Origin: *` is required (downloaded files have origin `null`); compensate with: per-IP and per-bot rate limits (`@upstash/ratelimit`), daily token quota per bot, `max_tokens` cap, request-size limits, and a kill switch per bot.
- Validate every body with Zod; return stable error codes; never leak stack traces.
- **Hosted mode never returns the system prompt** to any client.
- Prompt-injection hygiene: user content and retrieved knowledge are clearly delimited as data; the guardrail blocks (prompt-leak, jailbreak resistance) are added by default in templates.

### 7.5 Voice routes
- `stt`: accept short clips only (enforce a size cap safely below the serverless request-body limit and Sarvam's duration limits), forward to Sarvam, return `{ transcript, language }`.
- `tts`: one sentence per request; return audio bytes with correct `Content-Type`; cache identical sentence+voice pairs briefly.
- Read model names, speaker names, supported languages, and allowed parameters from `VOICE_CAPABILITIES`; validate against it before calling Sarvam.
- Verify current request/response schemas in the Sarvam docs and implement a startup self-check that logs a clear warning if a configured model is rejected.

### 7.6 Memory and knowledge
- Memory modes: `none`, `session` (last N messages), `summary` (rolling summary updated every K turns by a small model call).
- Knowledge: chunk (about 500 tokens, overlap), embed, store in pgvector, retrieve top-k per message, inject into the runtime-context section with source labels. Honour "answer only from knowledge" and "unknown-answer behaviour" blocks. Choose an embedding provider that is actually available with the configured keys and document it; if none, fall back to keyword (BM25-style) search and say so in `DECISIONS.md`.

### 7.7 Moderation
Input and output checks at `standard`/`strict` levels: a fast rule layer plus a model-based classifier (use a guard/safety model if available on the configured provider; verify in docs). Blocked content returns a configurable safe reply and is logged without storing the raw text when privacy mode is on.

---

## 8. WhatsApp gateway (`services/whatsapp-gateway`)

### 8.1 Responsibilities
**Gateway = transport and media. Platform = brain.**
- Gateway: Twilio webhook, signature validation, media download, image downscale, audio STT/TTS and conversion, throttled sending, bot binding, commands, Redis sessions.
- Platform (`/api/internal/respond`): compile prompt for `channel="whatsapp"`, apply memory/knowledge/moderation, call Groq (key pool), return the reply. One place for prompts, keys, and analytics.

### 8.2 Contract: `POST {PLATFORM_URL}/api/internal/respond`
Headers: `X-Internal-Secret`. Request (Zod-validated on both sides, shared as JSON Schema in `docs/contracts/`):
```json
{
  "botId": "uuid",
  "sessionId": "hash-of-phone",
  "channel": "whatsapp",
  "input": { "type": "text|image|voice", "text": "…", "imageBase64": "…", "mime": "image/jpeg", "detectedLanguage": "hi" },
  "history": [{ "role": "user", "content": "…" }]
}
```
Response: `{ "reply": "…", "language": "hi", "usage": {…}, "flags": ["handoff","lead_captured"] }`.
Images are **downscaled in the gateway** (Pillow; max side about 1024 px, JPEG) so the request stays well under serverless body limits. Fetch bot config via `GET /api/internal/bots/{id}` (cached in Redis for a short TTL) for language and voice settings.

### 8.3 Routing many bots through one sandbox number
- Binding stored in Redis and Postgres as `sha256(salt + phone) → botId`; raw phone numbers are used only transiently to send replies.
- Commands (case-insensitive, handled before the LLM): `/use <code>`, `/bots` (list recent codes for that user if any), `/reset`, `/lang <code>`, `/help`. Unbound users get a short welcome that explains `/use <code>`.
- `POST /api/bots/[id]/whatsapp/code` issues a short human-friendly code; the **Export to WhatsApp** dialog shows: sandbox number, join keyword (from env), a QR code and `wa.me` deep link with prefilled `join <keyword>`, the `/use <code>` instruction, the 3-day sandbox expiry and 24-hour window notices, and a **test panel** that shows last webhook status.

### 8.4 Behaviour details
- Voice notes: STT (Sarvam), language from transcript, platform reply, then **text first**, TTS audio second (if the bot enables voice-note replies), honouring the send throttle. Keep `afconvert` (macOS) and `ffmpeg` (Linux/Windows) paths; the Docker image installs `ffmpeg`.
- Language: mirror the user within the bot's allowed languages; the bot's primary language is the fallback.
- Errors: always send a short, friendly failure message in the user's language; never expose internals.
- `GET /health` returns versions, Redis connectivity, and whether Twilio/Sarvam/platform credentials are present (booleans only).

### 8.5 Packaging
`Dockerfile` (python:3.11-slim + ffmpeg), `render.yaml` (or Railway/Fly equivalent), `.env.example`, `README.md` updated (remove KisanMitra-specific copy; keep a "Run locally with ngrok" section), `pytest` suite with the Twilio, Sarvam, Groq, Redis, and platform clients mocked. Local development keeps the **ngrok** workflow from the existing docs.

---

## 9. Exports

### 9.1 Standalone HTML (`/api/bots/[id]/export/html`)
- **One file.** Inline CSS and JS; no external requests except the configured API base and, optionally, a small allow-listed set of fonts. Works offline for BYOK text chat.
- Built from the **same chat renderer** as the app (section 6.3), bundled and inlined at build time.
- **Hosted mode:** embeds `{ apiBase, botId, publicToken, ui, voice (public subset) }` only. Chat via SSE `fetch` streaming; voice via `/stt` and `/tts`.
- **BYOK mode:** embeds the compiled prompt and a field where the user pastes their own Groq key (kept in `localStorage`, never sent anywhere except Groq). Show a clear in-file notice. Verify browser CORS behaviour for direct Groq calls; if blocked, document the limitation and offer a small copy-paste proxy snippet instead.
- Include a visible footer with bot name, version, and generation date; an `<noscript>` message; a short "how to use / how to host" comment block at the top.
- **Export contract tests:** (1) the file contains no string matching key patterns or the compiled prompt in hosted mode, (2) it parses as valid HTML, (3) a Playwright test opens it via `file://` and via `http://localhost`, sends a message against a mocked API, and sees a streamed reply, (4) size is reported and kept reasonable.

### 9.2 Embed widget
`/embed.js?bot=<slug>` injects a launcher and an iframe pointing to `/b/<slug>?embed=1`, with `postMessage` for open/close/resize. One `<script>` tag. Document it on the Publish page with a copy button and a live test frame.

### 9.3 Hosted page
`/b/[slug]`: themed, responsive, includes voice UI when enabled, `robots` controlled per bot (default noindex), share button, QR code.

---

## 10. Voice UI

- States: idle, listening, thinking, speaking, error. Animated orb or waveform driven by `AnalyserNode` energy; fall back to a simple pulse when `prefers-reduced-motion`.
- Input: push-to-talk and hands-free (voice activity detection; a lightweight energy-based VAD is acceptable, or a well-maintained VAD library in the app, but the **exported file must stay dependency-free**).
- Output: sentence-level pipeline: SSE `sentence` events go to an ordered TTS queue; start playing the first sentence as soon as it is ready; **barge-in** cancels playback and in-flight requests.
- Live captions toggle; text fallback input always available; clear permission-denied and no-microphone messages.
- Handle autoplay restrictions (require a user gesture before the first audio).
- Clips are short; enforce client-side max duration and size before upload.

---

## 11. Data model (Postgres, RLS on all tables)

```
profiles(id uuid pk → auth.users, display_name, role text default 'user', created_at)
bots(id uuid pk, owner_id, slug unique, name, mode, industry, config jsonb, compiled_hash,
     version int, status text, public_token_hash, whatsapp_code unique null, created_at, updated_at)
bot_versions(id, bot_id, version int, config jsonb, note, created_at)
knowledge_sources(id, bot_id, kind, name, status, created_at)
knowledge_chunks(id, source_id, bot_id, content, embedding vector, meta jsonb)
conversations(id, bot_id, channel, session_hash, started_at, last_at, meta jsonb)
messages(id, conversation_id, role, content, latency_ms, tokens_in, tokens_out, feedback smallint null, created_at)
leads(id, bot_id, conversation_id, fields jsonb, created_at)
whatsapp_bindings(phone_hash pk, bot_id, created_at, last_seen_at)
templates(id, slug, name, industry, config jsonb, is_public, author_id)
key_events(id, key_alias, status, model, at)     -- no secrets
```
Policies: owners read/write their bots and derived rows; the public hosted API uses a service role **only inside server code**, scoped by bot id and token check; analytics queries are aggregated server-side.

---

## 12. Analytics and admin

- Per bot, per channel: conversations, messages, unique sessions, average and p95 latency, tokens, thumbs up/down ratio, leads, top questions (grouped by normalised text), **unanswered questions** (replies that triggered the unknown-answer behaviour), hourly heatmap. Date-range filter, CSV export.
- Privacy: logging is opt-in per bot, retention setting (7/30/90 days) enforced by a scheduled job, and a visible end-user notice when logging is on.
- `/admin/keys`: per-key alias, status (healthy/cooling/dead), cooldown remaining, requests and 429s in the last hour, last error class. Never shows key material.

---

## 13. Quality bar

- **Accessibility:** WCAG 2.2 AA target. Keyboard-operable drag and drop with screen-reader announcements; focus management in dialogs; labelled controls; colour-contrast checks; reduced-motion support; live regions for streamed replies (throttled).
- **Performance:** builder interactions under 100 ms; Lighthouse performance 90+ on the landing page and hosted bot; exported HTML under a sensible size budget (report it).
- **Reliability:** every external call has a timeout, bounded retries, and a user-safe error path.
- **Security checklist** (implement and test): secrets only server-side; SSRF guard on REST-lookup actions; XSS-safe markdown rendering; CSRF-safe mutating routes; per-route Zod validation; rate limits; Twilio signature validation; constant-time secret comparison; no PII in logs; dependency audit in CI.
- **Testing minimums:** core package at least 90 percent line coverage; keypool, compiler, exporter contract, and gateway routing have dedicated tests; Playwright flows for (a) build a bot and chat, (b) customise UI, (c) export HTML and chat from the file, (d) voice happy path with mocked Sarvam.

---

## 14. Milestones (do them in order; each ends green: lint, types, tests)

**M0: Scaffold and import.** Monorepo, tooling, CI, `.gitignore`, `.env.example` files. Move `whatsapp_feature/` to `services/whatsapp-gateway/` (excluding `venv`, `.venv`, `.env`), add pytest, confirm the existing pipelines still run in tests with mocks. *Accept:* `pnpm test` and `pytest` pass; no secrets tracked.

**M1: Core package.** Schemas, registry (60+ blocks to start), compiler with trace, conflicts, score, templates (at least 4), snapshot tests. *Accept:* coverage target met; registry validation passes; compile output is deterministic.

**M2: LLM gateway and streaming.** Key pool with Redis state and tests, `/api/preview/chat` streaming, minimal builder page with preview. *Accept:* simulated 429 on key 1 fails over invisibly; all-cooling path hits fallback model; `/admin/keys` shows state.

**M3: Builder studio.** Palette, canvas with dnd-kit, inline editors for every `kind`, prompt panel, conflicts with fixes, score, undo/redo, autosave and versions, magic box, templates, remix, command palette, tour, A/B console; grow registry to 120+ blocks. *Accept:* Playwright "build a bot in under 2 minutes" flow passes; keyboard-only drag works.

**M4: UI customiser and outputs.** Shared chat renderer, customiser with live preview, hosted page, embed widget, HTML export (hosted and BYOK), public API protection, publish page. *Accept:* export contract tests pass; no key or prompt leak in hosted export; widget works on a plain HTML test page.

**M5: Voice.** Sarvam STT/TTS routes with capability config, voice blocks, voice UI (app and export), sentence streaming, barge-in. *Accept:* mocked end-to-end voice test passes; manual test script documented; startup self-check works.

**M6: WhatsApp multi-tenant.** Refactor per section 1.2 and 8; platform internal routes; binding, commands, Redis sessions, signature validation, background processing, throttling, Export-to-WhatsApp dialog with QR. *Accept:* pytest suite green; two different bots can be used from two phones through one sandbox number via `/use`; webhook returns quickly even when the voice pipeline is slow.

**M7: Analytics, gallery, hardening, docs, deploy.** Dashboards, CSV export, retention job, gallery, a11y pass, performance pass, seed data (5 demo bots), `RUNBOOK.md`, `DEMO.md` (the three-minute script in `PROJECT.md`), Vercel and Render deployment instructions, production env checklist. *Accept:* fresh clone to running app using only the README; demo script succeeds end-to-end.

---

## 15. Environment variables

**apps/web**
```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=            NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=           # server only
UPSTASH_REDIS_REST_URL=              UPSTASH_REDIS_REST_TOKEN=
GROQ_API_KEYS=k1,k2,...              # comma-separated, up to 10, server only
GROQ_DEFAULT_MODEL=                  GROQ_FALLBACK_MODELS=      GROQ_VISION_MODEL=
SARVAM_API_KEY=                      # server only
SARVAM_STT_MODEL=                    SARVAM_TTS_MODEL=          # verify against current docs
INTERNAL_API_SECRET=                 # shared with the gateway
PUBLIC_TOKEN_PEPPER=                 PHONE_HASH_SALT=
ADMIN_EMAILS=
```
**services/whatsapp-gateway**
```
TWILIO_ACCOUNT_SID=  TWILIO_AUTH_TOKEN=  TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_SANDBOX_KEYWORD=              # shown in the export dialog
PUBLIC_BASE_URL=                     # ngrok URL in dev, Render URL in prod (used for signature validation and audio URLs)
SARVAM_API_KEY=  SARVAM_STT_MODEL=  SARVAM_TTS_MODEL=
PLATFORM_URL=  INTERNAL_API_SECRET=
REDIS_URL=  PHONE_HASH_SALT=  DEV_SKIP_SIGNATURE=false  PORT=8000
```
Provide `.env.example` for each with comments. **Do not create or commit real `.env` files.**

**Official documentation to consult (do not rely on memory):** Groq console docs (models, rate limits, vision, streaming); Sarvam docs at `docs.sarvam.ai` (Models page, speech-to-text, text-to-speech, language identification); Twilio WhatsApp Sandbox docs at `twilio.com/docs/whatsapp/sandbox` and request validation docs; Supabase RLS and pgvector docs; Upstash Redis and ratelimit docs; Vercel function limits for the current plan.

---

## 16. Things you must not do

- Do not put any API key, system prompt (in hosted mode), or internal URL secret into client bundles or exported files.
- Do not hard-code model names, speaker names, or language lists outside configuration.
- Do not invent API parameters. If docs and existing code disagree, trust the docs, test, and note it in `DECISIONS.md`.
- Do not store raw phone numbers; do not log message content when privacy mode is on.
- Do not use `localStorage` for anything sensitive except the user-pasted BYOK key inside the exported file, with the notice described above.
- Do not ship placeholder blocks that have no real effect on the compiled prompt.
- Do not leave the old `KisanMitra`-specific strings in the gateway outside the Agriculture template.

---

## 17. Final deliverables and report

1. Working monorepo meeting every milestone's acceptance criteria.
2. `README.md` (setup in under 15 minutes), `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/RUNBOOK.md`, `docs/DEMO.md`.
3. Seed data and 12 industry templates.
4. A final message to the user containing: what was built, what was verified (with commands), what could not be verified (for example live Twilio/Sarvam calls without credentials), any deviations from this brief and why, and a short list of recommended next steps.

If you hit a genuine blocker that cannot be resolved with documentation or a safe default, stop and ask one precise question, offering your best-guess default so work can continue if the user is unavailable.
