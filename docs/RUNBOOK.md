# PersonaForge — Production Runbook & Operations Manual

This runbook provides complete operational procedures for local development, production deployment, telemetry monitoring, and incident mitigation for the **PersonaForge** platform.

---

## 1. Architecture & Monorepo Topology

```
personaforge/
├── apps/web/                      # Next.js 15 (App Router, React 19, Tailwind CSS)
│   ├── app/                       # Studio Builder, Customizer, Hosted Page, Admin Telemetry
│   ├── lib/                       # Groq key pool, SSE streaming, Upstash Redis, exporter
│   └── supabase/migrations/       # Postgres schema with RLS, pgvector, retention jobs
├── packages/core/                 # Pure TypeScript prompt compiler (Zero I/O)
│   ├── src/blocks/                # 120+ modular blocks across 15 categories
│   ├── src/compiler/              # 11-section prompt compiler with line trace & budget compaction
│   ├── src/conflicts/             # Contradiction detection engine with 1-click fixes
│   ├── src/scorer/                # Deterministic 0–100 offline quality evaluator
│   └── src/templates/             # 12 domain presets (Agriculture, Healthcare, E-Commerce, etc.)
├── services/whatsapp-gateway/     # Hardened FastAPI microservice (Python 3.11+)
│   ├── whatsapp_handler.py        # Twilio FastAck webhook, signature check, phone hashing
│   └── ai_services.py             # LLM chat/vision, Sarvam STT/TTS, audio format conversion
└── docs/                          # Architecture, Runbook, Demo script, Decision records
```

---

## 2. Local Development Quickstart (<15 Minutes)

### Prerequisites
- **Node.js**: v20.0+
- **pnpm**: v9.0+
- **Python**: 3.11+
- **FFmpeg**: For audio conversion (`brew install ffmpeg` on macOS, `apt install ffmpeg` on Ubuntu)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/falcon/PersonaForge.git
cd PersonaForge

# Install monorepo JS dependencies
pnpm install

# Build core package
pnpm --filter core build
```

### Step 2: Set Up Python Gateway Virtual Environment
```bash
cd services/whatsapp-gateway
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### Step 3: Configure Environment Variables
Copy `.env.example` templates in both workspaces:
```bash
cp apps/web/.env.example apps/web/.env.local
cp services/whatsapp-gateway/.env.example services/whatsapp-gateway/.env
```
*(Ensure all actual keys remain local and are never committed to git).*

### Step 4: Run Development Servers
In Terminal 1 (Next.js Studio Web App):
```bash
pnpm --filter web dev
# Studio accessible at http://localhost:3000
```

In Terminal 2 (FastAPI WhatsApp Gateway):
```bash
cd services/whatsapp-gateway
source .venv/bin/activate
uvicorn whatsapp_handler:app --reload --port 8000
# Gateway healthcheck at http://localhost:8000/health
```

---

## 3. Environment Variables & Secret Hygiene

> [!IMPORTANT]
> PersonaForge enforces a strict **Zero-Secret Leak** policy. Keys are never printed in logs or sent to browser clients. Groq keys are referenced exclusively by their ordinal aliases (`k1`..`k10`).

### `apps/web` Variables
| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | Base public URL of web application (e.g. `http://localhost:3000` or `https://personaforge.io`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase client anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side Supabase privileged key for bot verification |
| `UPSTASH_REDIS_REST_URL` | Optional | Upstash Redis REST endpoint (falls back to in-memory adapter offline) |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Upstash Redis REST authorization token |
| `GROQ_API_KEYS` | Yes | Comma-delimited list of up to 10 Groq keys (`gsk_...,gsk_...`). Aliased as `k1`..`k10` |
| `GROQ_DEFAULT_MODEL` | No | Default model (defaults to `llama-3.3-70b-versatile`) |
| `GROQ_FALLBACK_MODELS` | No | Comma-delimited fallback chain (defaults to `llama-3.1-8b-instant`) |
| `GROQ_VISION_MODEL` | No | Vision model (defaults to `llama-3.2-11b-vision-preview`) |
| `SARVAM_API_KEY` | Optional | Sarvam AI API key for Speech-to-Text and Text-to-Speech |
| `SARVAM_STT_MODEL` | No | Speech recognition model (defaults to `saarika:v2.5`) |
| `SARVAM_TTS_MODEL` | No | Speech synthesis model (defaults to `bulbul:v3`) |
| `INTERNAL_API_SECRET` | Yes | Cryptographic secret shared with WhatsApp gateway for `/api/internal/*` |
| `PUBLIC_TOKEN_PEPPER` | Yes | Server pepper used to hash public bot access tokens |
| `PHONE_HASH_SALT` | Yes | Salt used to compute `sha256(salt + phone)` |
| `ADMIN_EMAILS` | No | Comma-separated admin emails permitted to view `/admin/keys` |

### `services/whatsapp-gateway` Variables
| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Yes | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio Auth Token (used for `X-Twilio-Signature` validation) |
| `TWILIO_WHATSAPP_FROM` | Yes | WhatsApp sender address (e.g. `whatsapp:+14155238886`) |
| `TWILIO_SANDBOX_KEYWORD`| Yes | Twilio sandbox join keyword (e.g. `join bright-river`) |
| `PUBLIC_BASE_URL` | Yes | Publicly accessible URL (Render domain or ngrok tunnel URL) |
| `PLATFORM_URL` | Yes | PersonaForge platform base URL (e.g. `http://localhost:3000`) |
| `INTERNAL_API_SECRET` | Yes | Secret matching platform's `INTERNAL_API_SECRET` |
| `REDIS_URL` | Optional | Redis connection string (falls back to local memory if empty) |
| `PHONE_HASH_SALT` | Yes | Salt matching platform's `PHONE_HASH_SALT` |
| `DEV_SKIP_SIGNATURE` | No | Set to `true` strictly during local test mock execution |
| `PORT` | No | HTTP listening port (defaults to `8000`) |

---

## 4. Production Deployment Guide

### A. Database Provisioning (Supabase)
1. In your Supabase dashboard, navigate to the **SQL Editor**.
2. Run migration `apps/web/supabase/migrations/20261101000000_init_schema.sql` to initialize:
   - `vector` and `uuid-ossp` extensions.
   - Core tables (`profiles`, `bots`, `conversations`, `messages`, `leads`, `whatsapp_bindings`, `templates`).
   - Row Level Security (RLS) policies.
   - Conversation auto-purge stored procedure `purge_expired_conversations()`.
3. Run migration `apps/web/supabase/migrations/20261101000001_seed_demo_bots.sql` to install the 5 production demo blueprints.
4. Set up a daily cron job via `pg_cron` (or Supabase scheduled Edge Function) to enforce retention:
```sql
SELECT cron.schedule('purge-expired-logs', '0 3 * * *', 'SELECT purge_expired_conversations();');
```

### B. Web App Deployment (Vercel)
1. Connect your repository to **Vercel**.
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to Next.js.
4. Set **Build Command** to `cd ../.. && pnpm --filter core build && pnpm --filter web build`.
5. Enter all production environment variables from section 3.
6. Deploy. Vercel automatically deploys the Next.js 15 App Router with full Server-Sent Events (SSE) streaming capabilities.

### C. WhatsApp Gateway Deployment (Render / Railway)
The gateway includes a production Dockerfile with `ffmpeg` pre-installed:
1. Create a **New Web Service** on Render or Railway.
2. Select repository and set **Root Directory** to `services/whatsapp-gateway`.
3. Set environment to **Docker**.
4. Configure required environment variables (including `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `PUBLIC_BASE_URL`).
5. Once deployed, set your Twilio WhatsApp Sandbox incoming webhook URL to:
   `https://<your-render-app>.onrender.com/webhook` (HTTP POST).

---

## 5. Operations & Incident Playbooks

### Playbook 1: Groq Key Pool Exhaustion / 429 Cascades
- **Symptoms**: Studio preview or hosted chat logs show `429 Too Many Requests`.
- **Diagnosis**: Open `/admin/keys`. Check the status of each key alias (`k1`..`k10`). If all keys are marked cooling with positive TTLs, organization rate limits have been exceeded.
- **Resolution**:
  1. The key pool automatically cascades to `llama-3.1-8b-instant` fallback models when 70B models are throttled.
  2. If all keys are rate-limited, supply additional keys across independent Groq organizations in `GROQ_API_KEYS`.
  3. Verify that bot caching is enabled (`runtime.cache: true`) for frequently asked queries.

### Playbook 2: Twilio Webhook Timeouts / 15-Second Delivery Drops
- **Symptoms**: Twilio console reports Error `11200 - HTTP Retrieval Failure`.
- **Diagnosis**: Gateway is blocking the event loop or taking >15 seconds before responding.
- **Resolution**:
  1. Confirm that `whatsapp_handler.py` FastAck is operational: the endpoint must immediately return HTTP 200 within 50ms and delegate work to `BackgroundTasks`.
  2. Inspect Render logs for the async background job execution time.
  3. Verify that outbound messages are throttled by `SendThrottler` (1.2s delay between chunks) to prevent carrier spam detection.

### Playbook 3: Audio Transcoding Failures
- **Symptoms**: Voice note replies fail on WhatsApp or `/audio/{filename}` returns 500.
- **Diagnosis**: `ffmpeg` (Linux) or `afconvert` (macOS) is missing or unable to convert WAV to AAC/MP4.
- **Resolution**:
  1. Verify Docker container has `ffmpeg` installed: `docker exec -it <container> ffmpeg -version`.
  2. Check `/tmp/pf_audio` permissions and disk space.
  3. Ensure `/audio/{filename}` enforces UUID regex validation and that the 5-minute TTL purge task is running without errors.

### Playbook 4: Standalone HTML Export BYOK Limitations
- **Symptoms**: User reports downloaded BYOK HTML cannot connect to Groq API.
- **Diagnosis**: Browser CORS restrictions block direct client-side requests from `file://` or custom local domains to `api.groq.com`.
- **Resolution**:
  1. Confirm the user is hosting the file on a local or public HTTP server (`http://localhost:8080`) rather than opening directly as `file://`.
  2. If browser CORS restrictions apply, recommend using **Hosted Mode** export, which routes through the PersonaForge streaming proxy with zero credential exposure.

---

## 6. Verification Test Suite Commands

Run all verification test suites locally before pushing to production:

```bash
# 1. Monorepo Typecheck (All workspaces)
pnpm -r typecheck

# 2. Pure TS Core Engine Tests (34 tests)
pnpm --filter core test

# 3. Next.js Web App Tests (27 tests: keypool, streaming, exporter, voice)
pnpm --filter web test

# 4. WhatsApp FastAPI Gateway Pytest Suite (18 tests)
cd services/whatsapp-gateway
source .venv/bin/activate
pytest -v
ruff check .
```
