# PersonaForge

<div align="center">

**The No-Code AI Persona & Voice Bot Studio**  
*Assemble modular behavioral blocks, watch system prompts compile deterministically in real time, and publish everywhere.*

[![CI Status](https://github.com/falcon/PersonaForge/actions/workflows/ci.yml/badge.svg)](https://github.com/falcon/PersonaForge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)

[**Architecture**](docs/ARCHITECTURE.md) • [**Decisions (ADRs)**](docs/DECISIONS.md) • [**Runbook**](docs/RUNBOOK.md) • [**Demo Script**](docs/DEMO.md) • [**Templates Gallery**](apps/web/app/gallery/page.tsx)

</div>

---

## 1. What is PersonaForge?

Crafting reliable conversational AI agents is traditionally broken:
- Prompts are manual, fragile walls of text with silent logical contradictions.
- Safety guardrails and compliance rules are easily forgotten or jailbroken.
- Porting an assistant from a web prototype to WhatsApp or an embeddable widget requires rewriting the backend.

**PersonaForge** turns prompt engineering into visual block assembly:
1. **Assemble**: Choose from **120+ modular blocks** across 15 categories (Identity, Personality, Tone, Guardrails, Knowledge, Actions, Channel Overrides).
2. **Observe**: The prompt compiler executes in **sub-millisecond pure TypeScript**, generating 11 structured sections with line-by-line trace mapping.
3. **Heal & Score**: The offline conflict engine identifies contradictory instructions (e.g. *Formal Tone* vs *Gen-Z Slang*) with **1-click automated patches**, backed by a deterministic 0–100 quality scorer.
4. **Publish Everywhere**:
   - **Hosted Branded Web Page** (`/b/[slug]`) with live chat and interactive voice.
   - **Single `<script>` Embed Widget** (`/embed.js?bot=[slug]`) for any website.
   - **Standalone Single-File HTML** with zero dependencies (Hosted Mode & BYOK offline mode).
   - **Multi-Tenant WhatsApp Gateway** allowing hundreds of bots through a single Twilio number using `/use <code>`.

---

## 2. Monorepo Topology

```
personaforge/
├── apps/web/                      # Next.js 15 (App Router, React 19, Tailwind CSS)
│   ├── app/                       # Studio Builder, Customizer, Hosted Page, Admin Telemetry
│   ├── lib/                       # Groq key pool, SSE streaming, Upstash Redis, HTML exporter
│   └── supabase/migrations/       # Postgres schema with RLS, pgvector, retention cleanup
├── packages/core/                 # Pure TypeScript compiler & block registry (Zero I/O)
│   ├── src/blocks/                # 120+ modular blocks across 15 categories
│   ├── src/compiler/              # 11-section prompt compiler with line trace & budget compaction
│   ├── src/conflicts/             # Contradiction detection engine with 1-click fixes
│   ├── src/scorer/                # Deterministic 0–100 offline quality evaluator
│   └── src/templates/             # 12 domain presets (Agriculture, Healthcare, E-Commerce, etc.)
├── services/whatsapp-gateway/     # Hardened FastAPI microservice (Python 3.11+)
│   ├── whatsapp_handler.py        # Twilio FastAck webhook, signature check, phone hashing
│   └── ai_services.py             # LLM chat/vision, Sarvam STT/TTS, audio format conversion
└── docs/                          # Comprehensive technical documentation
```

---

## 3. Fast 15-Minute Local Setup

### System Prerequisites
- **Node.js**: v20.0+
- **pnpm**: v9.0+ (`npm i -g pnpm`)
- **Python**: 3.11+
- **FFmpeg**: Required for audio transcoding (`brew install ffmpeg` on macOS, `apt install ffmpeg` on Linux)

### Step 1: Clone and Install
```bash
git clone https://github.com/falcon/PersonaForge.git
cd PersonaForge

# Install monorepo JS dependencies
pnpm install

# Build the pure TypeScript core compiler
pnpm --filter core build
```

### Step 2: Set Up Python Gateway
```bash
cd services/whatsapp-gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### Step 3: Configure Environment Files
Copy the provided `.env.example` templates in both workspaces:
```bash
cp apps/web/.env.example apps/web/.env.local
cp services/whatsapp-gateway/.env.example services/whatsapp-gateway/.env
```
*(PersonaForge strictly enforces zero secrets in code or git. Refer to keys only by alias `k1`..`k10`).*

### Step 4: Run the Development Servers
In Terminal 1 (Next.js Studio Web App):
```bash
pnpm --filter web dev
# Open http://localhost:3000 to launch PersonaForge Studio
```

In Terminal 2 (WhatsApp FastAPI Gateway):
```bash
cd services/whatsapp-gateway
source .venv/bin/activate
uvicorn whatsapp_handler:app --reload --port 8000
# Gateway health check at http://localhost:8000/health
```

---

## 4. Key Architectural Features

### Pure TypeScript Compiler (`packages/core`)
- Zero network, zero file system, zero runtime dependencies.
- Sub-millisecond snapshot-tested compilation.
- **Line-level trace mapping** highlights exactly which block generated each prompt line in the builder.
- **Token budget compaction** drops lowest-priority blocks gracefully when exceeding budget constraints.

### Groq Key Pool with Automated Failover (`apps/web`)
- Round-robin load distribution across up to 10 Groq keys (`k1`..`k10`).
- Automated 429 backoff cooldowns parsing `Retry-After` headers.
- Automatic model cascading to fallback models (`llama-3.1-8b-instant`) when primary 70B models are throttled.
- Admin Telemetry UI (`/admin/keys`) with live 5-second auto-refresh and cooldown timers.

### Multi-Channel Voice Pipeline
- Sarvam AI integration (`saarika:v2.5` STT and `bulbul:v3` TTS).
- Animated 3D `VoiceOrb` reacting to real-time speech amplitude.
- Sentence-level streaming audio playback with **instant barge-in interruption**.

### Hardened Multi-Tenant WhatsApp Gateway
- **FastAck Architecture**: Webhook returns HTTP 200 within 50ms and delegates synthesis to async `BackgroundTasks`, eliminating Twilio 15s timeout risks.
- **Phone Anonymization**: All session tracking uses salted SHA-256 (`sha256(salt + phone)`).
- **Multi-Bot Routing**: Supports commands `/use <code>`, `/bots`, `/reset`, `/lang`, `/help`.
- **Security**: Full `X-Twilio-Signature` verification, Pillow 1280px image downscaling, and safe temporary audio lifecycle with 5-minute TTL purge.

---

## 5. Shipped Industry Templates (12 Presets)

PersonaForge ships with 12 domain-hardened templates in `packages/core/src/templates/`:
1. **Agriculture Advisor (KisanMitra)**: Grounded agricultural advice, crop diagnosis, mandi rates, Hindi/Hinglish honorifics.
2. **E-Commerce Concierge**: Product recommendations, order tracking, returns policy, and upsell rules.
3. **Business Support**: SaaS customer success agent with ticket escalation, SLA reminders, and calendar booking.
4. **Tech Helpdesk**: Diagnostic troubleshooting, step-by-step guidance, code snippet formatting, and logs collection.
5. **Healthcare Front Desk**: Non-diagnostic intake, appointment scheduling, insurance verification FAQs, and emergency disclaimers.
6. **Education & Tutoring**: Socratic inquiry method, age-graded explanations, quiz generation, and concept reinforcement.
7. **Finance FAQ**: Regulatory disclaimers, loan eligibility guidelines, branch hours, and fraud reporting instructions.
8. **HR Assistant**: Benefits overview, PTO policies, onboarding checklists, and confidential ethics escalation.
9. **Travel & Hospitality**: Itinerary planning, local recommendations, room amenities, and booking links.
10. **Real Estate**: Property matchmaking, mortgage calculators, neighborhood insights, and viewing appointments.
11. **Government Services**: Public scheme eligibility, required documentation guides, office locations, and grievance routing.
12. **Creative & Character Bots**: Backstory lore, catchphrases, creative constraints, and persona storytelling.

---

## 6. Testing & Quality Verification

PersonaForge maintains 100% passing test suites across all packages:

```bash
# Monorepo typecheck across all workspaces (0 errors)
pnpm -r typecheck

# Unit tests for pure TS compiler, conflict engine, scorer (34 tests)
pnpm --filter core test

# Web app tests: Key pool, SSE streaming, Exporter contract, Voice (27 tests)
pnpm --filter web test

# Python WhatsApp gateway pytest suite with mocks (18 tests)
cd services/whatsapp-gateway
source .venv/bin/activate
pytest -v
ruff check .
```

---

## 7. Production Deployment & Documentation

- [**System Architecture & Topology Specification**](docs/ARCHITECTURE.md): Deep dive into pure TS compiler, key pool state machine, and gateway contracts.
- [**Architectural Decision Records (ADRs)**](docs/DECISIONS.md): Key decisions regarding zero secrets, rate-limit cascades, and FastAck webhook design.
- [**Production Operations Runbook**](docs/RUNBOOK.md): Step-by-step Vercel and Render deployment, Supabase SQL migrations, and incident troubleshooting.
- [**3-Minute Video Demo Script**](docs/DEMO.md): Complete narration, cues, and execution walkthrough.

---

## License

MIT License. Designed and engineered for production AI agent reliability.
