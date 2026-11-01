# PersonaForge — Engineering Execution Plan

## 1. Project Overview & Objectives
PersonaForge is a full-stack, no-code AI agent studio that empowers non-technical users to build, customize, test, and publish production-grade AI chatbots and voice bots. Bots can be published as:
1. **Hosted web page** (`/b/[slug]`)
2. **Embeddable script widget** (`/embed.js`)
3. **Downloadable standalone `.html` file** (Hosted mode and BYOK mode)
4. **Multi-tenant WhatsApp bot** via Twilio WhatsApp Sandbox

The core architecture decouples prompt compilation, UI customization, external key pools, and channel transport into a modular monorepo:
- `packages/core`: Pure TypeScript schema, 120+ block registry, prompt compiler with line-level trace, conflict detector, offline deterministic quality scorer, and templates.
- `apps/web`: Next.js 15 (App Router) studio with 3-pane builder, dnd-kit canvas, real-time SSE streaming preview, Groq Redis key-pool, chat UI customizer, analytics, and Supabase integration.
- `services/whatsapp-gateway`: Hardened, refactored FastAPI service supporting multi-tenant routing (`/use <code>`), Twilio signature validation, immediate 200 ack with async background processing, Sarvam STT/TTS, and rate-limiting.

---

## 2. Phase-Wise Execution Milestones

### Milestone 0 (M0): Workspace Scaffolding, Security & Import
- **Objective:** Establish the monorepo foundation, git hygiene, strict secrets isolation, and safely import existing WhatsApp service.
- **Tasks:**
  - Initialize Git repository and enforce `.gitignore` for `.env`, `venv/`, `.venv/`, `node_modules/`, `__pycache__/`, `.DS_Store`, build artifacts.
  - Setup pnpm workspace (`pnpm-workspace.yaml`, root `package.json`, `.editorconfig`).
  - Move `whatsapp_feature/` into `services/whatsapp-gateway/` (strictly excluding `.env`, `venv/`, `.venv/`, `__pycache__`).
  - Create standardized `.env.example` templates in root, `apps/web/`, and `services/whatsapp-gateway/`.
  - Set up Python virtual environment, dependencies (`requirements.txt`, `pyproject.toml` with `pytest`, `ruff`), and write initial unit tests verifying the legacy pipeline behavior with mocked external clients.
  - Set up GitHub Actions CI workflow (`.github/workflows/ci.yml`).
- **Acceptance Criteria:** `pnpm test` and `pytest` run and pass cleanly; zero secrets tracked; no `.env` files staged.

---

### Milestone 1 (M1): Core Engine (`packages/core`)
- **Objective:** Build the pure TypeScript core package that powers prompt compilation, validation, conflicts, scoring, and presets without any network or filesystem I/O.
- **Tasks:**
  - Define Zod schemas: `Channel`, `BotMode`, `BotConfig`, `UIConfig`, `VoiceConfig`, `PublicBot`, `ExportManifest`.
  - Design block definition architecture (`BlockDef<V>` with schemas, categories, priority, pure deterministic renderers, conflicts, and requirements).
  - Implement initial block registry covering core categories (Identity, Personality, Tone, Guardrails, Knowledge, Actions, Voice, Output Format, etc.).
  - Implement Registry Validation at import/startup (unique IDs, valid section targets, schema-conforming defaults).
  - Implement Prompt Compiler:
    - Fixed 11-section order (Identity, Business Context, Personality & Tone, Language, Knowledge Rules, Behaviour, Output Format, Guardrails, Actions, Examples, Runtime Context).
    - Fine-grained line-to-block trace mapping for visual highlighting.
    - Channel-aware rules (WhatsApp character caps and formatting, Voice spoken-style constraints).
    - Token estimate heuristic and priority-based compaction pass when budget is exceeded.
    - Expert mode handling (`expert.replace` bypass with warning, `expert.append` appended).
  - Implement Conflict Engine (`detectConflicts` returning conflicting pairs with 1-click executable patch fixes).
  - Implement Deterministic Quality Scorer (`scorePrompt` evaluating 0–100 score and checklist of actionable recommendations).
  - Implement Industry Templates (at least 4 initial presets, including faithful port of KisanMitra as Agriculture Advisor).
  - Write Vitest unit and snapshot tests achieving >90% code coverage.
- **Acceptance Criteria:** 100% deterministic compilation, comprehensive snapshot test suite passes, >90% line coverage, zero external I/O.

---

### Milestone 2 (M2): LLM Gateway, Key Pool & SSE Streaming
- **Objective:** Resilient LLM execution engine featuring Groq API key pooling with Redis state, failover, fallback model cascade, and real-time SSE streaming.
- **Tasks:**
  - Build Groq key pool (`apps/web/lib/llm/keypool.ts`):
    - Upstash Redis state tracking (`kp:cool:{i}`, `kp:rr`, `kp:stats:{i}:{hour}`, `kp:dead:{i}`).
    - In-memory mock/fallback adapter for testing and local zero-dependency operation.
    - Round-robin selection of active keys; automatic cooldown on HTTP 429 (`Retry-After` header parsing); short cooldown on 5xx; dead-key marking on 401/403.
    - Fallback model traversal when all keys are cooled.
    - Pre-stream failover (failover strictly before first byte is emitted).
    - Optional SHA256 exact-match cache for stateless bots.
  - Implement Server-Sent Events (SSE) streaming protocol:
    - Events: `meta` (conversation id), `token` (delta), `sentence` (voice mode), `done` (stats & latency), `error` (user-safe code & message).
  - Implement `/api/preview/chat` route for real-time draft testing in the studio.
  - Implement `/admin/keys` route and admin dashboard for key pool health (aliases only, zero secret leakage).
  - Unit tests with mocked HTTP client verifying 429 failover, cooldown expiry, fallback models, and dead keys.
- **Acceptance Criteria:** Simulated 429 on key 1 switches seamlessly to key 2; all-cooling path cascades to fallback models; key pool test suite passes.

---

### Milestone 3 (M3): Studio Builder (`apps/web`)
- **Objective:** The flagship 3-pane interactive drag-and-drop studio builder.
- **Tasks:**
  - **Left Pane (Palette):** Category tabs, search, industry filter, drag-and-drop handles, click-to-add, mode-compatibility disabling with tooltips.
  - **Center Pane (Canvas):** Sections in compile order; `@dnd-kit/core` + `@dnd-kit/sortable` with keyboard accessibility and live screen-reader announcements; rich inline editors for all 11 parameter kinds (`select`, `multiselect`, `slider`, `toggle`, `text`, `textarea`, `list`, `keyvalue`, `faq`, `file`, `color`); live conflict badges with 1-click patch button; line-level "why does this exist?" popovers.
  - **Right Pane (Multi-Tab Inspector):**
    1. *Preview:* Live streaming chat/voice tester with channel switcher (Web, WhatsApp, Voice) and session reset.
    2. *Prompt:* Live compiled system prompt with section headers, line highlighting, token gauge, copy button, and Expert Mode drawer.
    3. *Score:* Interactive quality score gauge with actionable checks.
    4. *A/B Console:* Side-by-side comparison of 2 bot versions running identical test question prompts with latency & token benchmarks.
  - **Top Navigation Bar:** Bot title, debounced autosave with optimistic concurrency (`version`), undo/redo (`zundo`/history), version history drawer, Magic Box generator, Randomize/Remix, Publish modal trigger.
  - **Magic Box (`POST /api/bots/generate`):** Natural language bot generator using structured JSON mode against machine-readable block catalogue.
  - **Command Palette (`Cmd+K` / `Ctrl+K`):** Fast navigation, block adding, test execution, theme toggling.
  - **Onboarding Tour:** First-run interactive product guide.
  - Scale block registry to 120+ unique, impactful blocks across all 15 categories.
- **Acceptance Criteria:** End-to-end bot creation flow passes; keyboard drag-and-drop works; 120+ validated blocks available in canvas.

---

### Milestone 4 (M4): UI Customizer, Embed Widget & Standalone Exporter
- **Objective:** A unified, framework-agnostic chat renderer running identically across React web app, hosted pages, embeddable script, and offline single-file HTML.
- **Tasks:**
  - Build universal chat renderer:
    - Themes (light/dark/auto), customizable CSS variables (primary, surface, accent).
    - Curated typography, bubble geometry/density, avatar, headers, backgrounds.
    - Markdown rendering with strict sanitization (`rehype-sanitize`).
    - Color contrast accessibility verification.
  - Standalone HTML Exporter (`POST /api/bots/[id]/export/html`):
    - *Hosted Mode:* Single HTML file embedding client-safe metadata (`apiBase`, `botId`, `publicToken`, `ui`, `voice`) with zero compiled prompt or secrets.
    - *BYOK Mode:* Single HTML file embedding compiled prompt and client-side Groq key storage in `localStorage`.
    - 100% self-contained: inlined CSS and JavaScript, no runtime external scripts required.
  - Embed Widget (`/embed.js?bot=<slug>`):
    - Floating launcher, responsive iframe overlay pointing to `/b/<slug>?embed=1`, bi-directional `postMessage` protocol for resize/open/close.
  - Hosted Public Page (`/b/[slug]`):
    - Dynamic themed layout, responsive mobile design, social metadata, QR code, share link.
  - Public API protection: token hashing, rate-limiting (`@upstash/ratelimit`), token quotas, kill-switch.
  - Publish Page with tabs for Hosted, Embed, Download HTML, and WhatsApp.
- **Acceptance Criteria:** HTML export contract tests pass; zero prompt/key leaks in hosted export; widget runs on plain static HTML page.

---

### Milestone 5 (M5): Voice Pipeline & Voice UI
- **Objective:** Low-latency bidirectional voice interaction powered by Sarvam AI STT/TTS.
- **Tasks:**
  - Capabilities configuration (`VOICE_CAPABILITIES`) declaring supported Sarvam models, speakers, and languages.
  - Backend endpoints:
    - `POST /api/public/bots/[id]/stt`: Audio upload validation, forwarding to Sarvam STT, returning transcript & detected language.
    - `POST /api/public/bots/[id]/tts`: Sentence-level TTS generation, WAV audio delivery with caching.
  - Voice UI Component:
    - States: `idle`, `listening`, `thinking`, `speaking`, `error`.
    - Fluid interactive audio orb / energy visualizer driven by `AnalyserNode` with smooth fallback for `prefers-reduced-motion`.
    - Push-to-talk and lightweight VAD (Voice Activity Detection).
    - Sentence-level streaming playback queue with instant barge-in cancellation.
    - Live captions toggle, text input fallback, microphone permission guidance, and audio autoplay gesture handling.
  - Startup self-check validating Sarvam API credentials and model endpoints.
- **Acceptance Criteria:** Mocked end-to-end voice test passes; sentence streaming plays without audio glitches; barge-in cuts playback immediately.

---

### Milestone 6 (M6): Multi-Tenant WhatsApp Gateway
- **Objective:** Comprehensive refactoring of `whatsapp_feature` into a secure, multi-tenant gateway supporting unlimited bots over a single Twilio sandbox number.
- **Tasks:**
  - Multi-tenant bot routing:
    - Bot binding using salted phone hash `sha256(salt + phone) -> botId`.
    - Built-in command interpreter: `/use <code>`, `/bots`, `/reset`, `/lang <code>`, `/help`.
    - Unbound user friendly onboarding menu.
  - Gateway architecture hardening:
    - Return HTTP 200 immediately to Twilio to prevent timeout; queue message processing in background tasks (`BackgroundTasks`).
    - Validate `X-Twilio-Signature` using `twilio.request_validator.RequestValidator` with public base URL (bypassable only via `DEV_SKIP_SIGNATURE=true`).
    - Redis-backed session management with configurable TTL.
    - Unicode-script fast language detection before LLM fallback.
    - Image optimization: client-side downscaling with Pillow (max dimension 1024px) before dispatch.
    - Outbound rate throttle / per-recipient queue (~1 msg per 3s for sandbox compliance).
    - Long reply splitting at sentence boundaries (1500 char cap).
    - Audio security: `/audio/{filename}` strictly validated with UUID regex `^[a-f0-9]{32}\.(wav|mp4)$`, size caps, and automated TTL cleanup.
    - Phone number masking in all logging outputs (`whatsapp:+91******1234`).
  - Platform integration contract:
    - Gateway dispatches to `POST /api/internal/respond` authenticated by `X-Internal-Secret`.
    - Gateway fetches bot configuration from `GET /api/internal/bots/{id}` with Redis caching.
  - UI Integration:
    - Export-to-WhatsApp modal in studio builder with QR code, `wa.me` deep link (`join <keyword>`), `/use <code>` instructions, and live webhook test inspector.
- **Acceptance Criteria:** Gateway test suite passes; multiple phone sessions route to different bots through `/use <code>`; webhook responds <500ms; Twilio signature validated.

---

### Milestone 7 (M7): Analytics, Templates, Polish & Production Readiness
- **Objective:** Complete observability dashboard, template gallery, accessibility compliance, end-to-end tests, and deployment documentation.
- **Tasks:**
  - Analytics Dashboard (`/builder/[id]/analytics`):
    - Channel breakdown, conversations, messages, sessions, P50/P95 latency, token usage, feedback sentiment, captured leads.
    - Top questions cluster and unanswered question inspector (triggering fallback behavior).
    - Hourly activity heatmap, date-range filters, and CSV export.
    - Privacy-compliant retention enforcement (7/30/90 days).
  - Gallery (`/gallery`):
    - 12 production-grade industry templates (Business Support, E-commerce, Education, Tech Helpdesk, Agriculture, Healthcare, Finance FAQ, HR, Travel, Real Estate, Government Services, Creative Persona).
    - "Use this template" 1-click clone workflow.
  - Seed Data: 5 pre-configured demo bots showcasing complex features (voice bot, bilingual support, lead capture).
  - Accessibility & Performance Audit:
    - WCAG 2.2 AA compliance check: screen-reader announcements, color contrast verification, keyboard navigation.
    - Lighthouse performance score >90.
  - Production Documentation:
    - `README.md`: Quickstart setup under 15 minutes.
    - `docs/ARCHITECTURE.md`: Monorepo structure, data flow, security model, and contracts.
    - `docs/DECISIONS.md`: Engineering trade-offs, vendor constraints, and design choices.
    - `docs/RUNBOOK.md`: Operational troubleshooting, key rotation, and deployment on Vercel & Render.
    - `docs/DEMO.md`: Complete 3-minute evaluation walkthrough script.
- **Acceptance Criteria:** Monorepo builds and tests pass cleanly across all workspaces; demo script executes end-to-end; documentation is comprehensive.

---

## 3. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Groq Organization Rate Limits** | Multiple API keys from the same account share rate limits. | Implement Redis-backed exponential backoff, round-robin cooldown tracking, and fallback model cascade (`llama-3.3-70b` → `llama-3.1-8b`). Document clearly in `DECISIONS.md`. |
| **Twilio Webhook 15s Timeout** | Twilio aborts webhooks if processing takes too long (e.g., STT + LLM + TTS pipeline). | Webhook endpoint validates input, schedules processing as an async background task, and returns HTTP 200 immediately. |
| **Twilio Sandbox Message Rate Limit** | Twilio sandbox drops messages sent too quickly (<3s apart). | Per-recipient outbound queue with artificial pacing delay (1.5s–3s) between text and audio notes. |
| **Sarvam Audio Format Compatibility** | WhatsApp requires AAC/MP4 audio containers for voice note playback. | Support both macOS native `afconvert` and Linux/Windows `ffmpeg` with fallback to WAV. Docker image includes `ffmpeg`. |
| **Serverless Request Body Limits** | Large voice or image uploads exceed Vercel/Next.js body size limits. | Enforce strict client-side audio/image limits; downscale images in gateway with Pillow; stream audio in sentence chunks. |
| **Prompt/Key Leaks in Exported HTML** | Exported HTML might inadvertently expose system prompt or API credentials in hosted mode. | Contract test in CI asserts that hosted export bundle contains zero prompt text, zero private keys, and only public bot tokens. |
| **SSRF in Action Blocks** | Custom REST webhook lookups could target internal AWS/cloud metadata or localhost. | Strict URL validation rejecting private/loopback IP ranges (RFC 1918, 127.0.0.1, 169.254.169.254), enforcing HTTPS, timeouts, and response size limits. |

---

## 4. Open Questions & Safe Defaults

1. **Supabase & Redis Local Availability:**
   - *Safe Default:* Provide full Supabase migrations and Upstash Redis integration, but include a zero-dependency in-memory/mock fallback adapter for local tests and offline development so all tests pass out-of-the-box without requiring live cloud credentials.
2. **Sarvam Model Names & Deprecations:**
   - *Safe Default:* Centralize all model identifiers in `VOICE_CAPABILITIES` using the latest verified endpoints (`saarika:v2.5` for STT, `bulbul:v3` for TTS).
3. **Embeddings Provider for Knowledge Retrieval:**
   - *Safe Default:* Support standard pgvector cosine similarity; if external embeddings API key is not configured, gracefully fall back to keyword BM25 retrieval and document this in `docs/DECISIONS.md`.
