# KisanMitra — WhatsApp Communication Intelligence Layer

> **PS-16 Farmer Direct-to-Consumer Fresh Produce Marketplace**
>
> This module handles ALL WhatsApp-based interactions for farmers — text chat,
> image analysis, and voice messages — using Twilio Sandbox, Sarvam AI, Groq,
> and ngrok for local webhook tunneling.

---

## Architecture

```
┌──────────────┐     ┌──────────┐     ┌───────┐     ┌─────────────────────┐
│   Farmer's   │────▶│  Twilio  │────▶│ ngrok │────▶│  FastAPI Server     │
│  WhatsApp    │◀────│ Sandbox  │◀────│ :8000 │◀────│  whatsapp_handler   │
└──────────────┘     └──────────┘     └───────┘     └────────┬────────────┘
                                                             │
                                              ┌──────────────┼──────────────┐
                                              ▼              ▼              ▼
                                        ┌──────────┐  ┌───────────┐  ┌──────────┐
                                        │ Groq LLM │  │ Groq      │  │ Sarvam   │
                                        │ Chat &   │  │ Vision    │  │ STT/TTS  │
                                        │ Language │  │ (Images)  │  │ (Voice)  │
                                        └──────────┘  └───────────┘  └──────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Node.js/Express │
                                     │  Main Backend    │
                                     │  (via hooks)     │
                                     └─────────────────┘
```

### Message Flow

| Message Type | Pipeline |
|---|---|
| **Text** | Detect language → Build context (hooks) → Groq LLM → Reply |
| **Image** | Download → Base64 encode → Groq Vision → Agricultural analysis → Reply |
| **Voice** | Download → Sarvam STT → Detect language → Groq LLM → Text reply + Sarvam TTS → Audio reply |

---

## File Structure

```
whatsapp_feature/
├── whatsapp_handler.py   # FastAPI server, webhook, routing, Twilio sender
├── ai_services.py        # All AI calls: Groq LLM/Vision, Sarvam STT/TTS
├── requirements.txt      # Python dependencies
├── .env.example          # Environment variable template
└── README.md             # This file
```

---

## Prerequisites

- **Python 3.10+** and pip
- **Twilio account** with WhatsApp Sandbox activated ([console.twilio.com](https://console.twilio.com))
- **Groq API key** ([console.groq.com](https://console.groq.com))
- **Sarvam AI API key** ([app.sarvam.ai](https://app.sarvam.ai))
- **ngrok** installed ([ngrok.com/download](https://ngrok.com/download))

---

## Setup

### 1. Install dependencies

```bash
cd whatsapp_feature
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (starts with `AC`) |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Sandbox number, usually `whatsapp:+14155238886` |
| `GROQ_API_KEY` | Groq API key (starts with `gsk_`) |
| `SARVAM_API_KEY` | Sarvam AI subscription key |
| `NGROK_PUBLIC_URL` | Your ngrok HTTPS URL (set after starting ngrok) |
| `BACKEND_BASE_URL` | Main Node.js backend URL (default: `http://localhost:3000`) |
| `PORT` | FastAPI port (default: `8000`) |

---

## Running

You need **two terminals**:

### Terminal 1 — Start ngrok tunnel

```bash
ngrok http 8000
```

Copy the **Forwarding** HTTPS URL (e.g. `https://abcd-1234.ngrok-free.app`) and update `NGROK_PUBLIC_URL` in your `.env` file.

### Terminal 2 — Start the FastAPI server

```bash
uvicorn whatsapp_handler:app --host 0.0.0.0 --port 8000 --reload
```

Or simply:

```bash
python whatsapp_handler.py
```

---

## Twilio Sandbox Configuration

1. Go to **Twilio Console** → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Join the sandbox by sending the displayed code from your WhatsApp
3. Click **Sandbox Settings** (or navigate to Sandbox Configuration)
4. Set **"When a message comes in"** to:
   ```
   https://YOUR_NGROK_URL/webhook
   ```
5. Method: **HTTP POST**
6. Click **Save**

---

## Integration with Main Node.js Backend

The WhatsApp service connects to your Express backend through **four integration hooks** in `whatsapp_handler.py`:

| Hook Function | Purpose | Backend Endpoint |
|---|---|---|
| `get_farmer_profile()` | Fetch farmer details by phone | `GET /api/farmers/by-phone/{phone}` |
| `get_farmer_orders()` | Fetch active orders | `GET /api/orders?farmerId={id}` |
| `get_market_prices()` | Get current mandi rates | `GET /api/market/prices` |
| `create_produce_listing()` | Create listing via chat | `POST /api/listings` |

### How to activate:

1. Set `BACKEND_BASE_URL` in `.env` to your Express server URL
2. Replace the stub `return` statements in each hook with real `httpx` calls:

```python
import httpx


async def get_farmer_profile(phone_number: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{BACKEND_BASE_URL}/api/farmers/by-phone/{phone_number}",
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()
```

3. The returned data is automatically injected into the LLM system prompt as context

The WhatsApp service is **stateless by design** — all persistent data lives in the main backend.

---

## Testing

| Test | What to send | Expected result |
|---|---|---|
| English text | `Hello` | English response from KisanMitra |
| Kannada text | `ನಮಸ್ಕಾರ` | Kannada response; session locked to Kannada |
| Hindi text | `नमस्ते` | Hindi response; session locked to Hindi |
| Image | Photo of a plant/crop | Agricultural analysis with actionable advice |
| Voice (Hindi) | Hindi voice note | Transcription shown + text reply + audio reply |
| Voice (Kannada) | Kannada voice note | Transcription + reply in Kannada text & voice |

### Health check

```bash
curl http://localhost:8000/health
# → {"status":"ok","service":"kisanmitra-whatsapp"}
```

---

## Extending for Production

| Concern | Solution |
|---|---|
| **Session persistence** | Replace in-memory `user_sessions` dict with Redis (`redis-py`) |
| **Async audio processing** | Add a Celery worker for heavy STT/TTS if voice load is high |
| **Rate limiting** | Use `slowapi` to rate-limit per phone number |
| **Conversation history** | Hook into Firebase/PostgreSQL for persistent chat logs |
| **Multiple languages** | Add new entries to `LANGUAGE_MAP` in `ai_services.py` |
| **HTTPS in production** | Deploy behind a reverse proxy (nginx) with TLS instead of ngrok |
| **Monitoring** | Add Prometheus metrics or Sentry error tracking |

---

## API Reference

### `POST /webhook`
Twilio WhatsApp webhook endpoint. Receives form-encoded data with fields: `From`, `Body`, `NumMedia`, `MediaUrl0`, `MediaContentType0`.

### `GET /audio/{filename}`
Serves TTS-generated audio files from the temp directory. Used by Twilio to deliver voice note responses.

### `GET /health`
Returns service health status.

---

## Models Used

| Service | Model | Purpose |
|---|---|---|
| Groq LLM | `llama-3.3-70b-versatile` | Chat responses & language detection |
| Groq Vision | `meta-llama/llama-4-scout-17b-16e-instruct` | Agricultural image analysis |
| Sarvam STT | `saarika:v2` | Voice-to-text transcription |
| Sarvam TTS | `bulbul:v1` | Text-to-voice responses |

---

## License

Part of the PS-16 Farmer Direct-to-Consumer Marketplace project.
