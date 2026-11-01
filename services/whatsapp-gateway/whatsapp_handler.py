"""
whatsapp_handler.py — Core FastAPI server for the WhatsApp Communication
Intelligence Layer (PS-16 Farmer Direct-to-Consumer Marketplace).

Endpoints:
  POST /webhook   — Twilio WhatsApp webhook receiver
  GET  /audio/{f} — Serves TTS audio files for Twilio media delivery
  GET  /health    — Health-check
"""

import base64
import logging
import os
import tempfile
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Form
from fastapi.responses import FileResponse, JSONResponse
from twilio.rest import Client as TwilioClient

import ai_services

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")
NGROK_PUBLIC_URL = os.getenv("NGROK_PUBLIC_URL", "")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:3000")
PORT = int(os.getenv("PORT", "8000"))

# Directory for temporary TTS audio files
AUDIO_TMP_DIR = Path(tempfile.gettempdir()) / "kisanmitra_audio"
AUDIO_TMP_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("whatsapp_handler")

# ---------------------------------------------------------------------------
# In-memory session store
# ---------------------------------------------------------------------------
# INTEGRATION NOTE: For production, replace this dict with a Redis-backed
# store.  Install `redis-py`, connect via REDIS_URL env var, and swap
# get/set calls below.  The session schema stays the same:
#   { "language": "en"|"hi"|"kn", "history": [{"role":..,"content":..}, ...] }
user_sessions: dict[str, dict] = {}


def _get_session(phone: str) -> dict:
    """Return (or create) the session dict for a phone number."""
    if phone not in user_sessions:
        user_sessions[phone] = {"language": None, "history": []}
    return user_sessions[phone]


# ---------------------------------------------------------------------------
# INTEGRATION HOOKS — replace stubs with HTTP calls to the Node.js backend
# ---------------------------------------------------------------------------


# INTEGRATION HOOK: Fetch farmer profile from main backend
# Replace this stub with an HTTP call to your Node.js backend
async def get_farmer_profile(phone_number: str) -> dict:
    # TODO: GET {BACKEND_BASE_URL}/api/farmers/by-phone/{phone_number}
    return {"name": "Farmer", "farm_id": None, "location": None}


# INTEGRATION HOOK: Fetch active orders for farmer
async def get_farmer_orders(farm_id: str) -> list:
    # TODO: GET {BACKEND_BASE_URL}/api/orders?farmerId={farm_id}
    return []


# INTEGRATION HOOK: Fetch current market prices
async def get_market_prices(produce_type: str = None) -> dict:
    # TODO: GET {BACKEND_BASE_URL}/api/market/prices
    return {}


# INTEGRATION HOOK: Post a new produce listing via chat command
async def create_produce_listing(farm_id: str, listing_data: dict) -> dict:
    # TODO: POST {BACKEND_BASE_URL}/api/listings
    return {}


async def _build_extra_context(phone: str) -> str:
    """Gather live data from integration hooks and format as prompt context."""
    profile = await get_farmer_profile(phone)
    orders = await get_farmer_orders(profile.get("farm_id") or "")
    prices = await get_market_prices()

    parts: list[str] = []
    if profile.get("name"):
        parts.append(f"Farmer name: {profile['name']}")
    if profile.get("location"):
        parts.append(f"Location: {profile['location']}")
    if orders:
        parts.append(f"Active orders: {len(orders)}")
    if prices:
        parts.append(f"Market prices available: {list(prices.keys())}")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Twilio sender utility
# ---------------------------------------------------------------------------
def send_whatsapp_message(to: str, body: str, media_url: str | None = None) -> bool:
    """Send a WhatsApp message via Twilio. Returns True on success."""
    try:
        client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        kwargs: dict = {
            "from_": TWILIO_WHATSAPP_FROM,
            "to": to,
            "body": body,
        }
        if media_url:
            kwargs["media_url"] = [media_url]
        msg = client.messages.create(**kwargs)
        logger.info("Twilio message sent: SID=%s to=%s", msg.sid, to)
        return True
    except Exception:
        logger.exception("Failed to send Twilio message to %s", to)
        return False


# ---------------------------------------------------------------------------
# Media download helper
# ---------------------------------------------------------------------------
def _download_twilio_media(media_url: str) -> bytes:
    """Download media from Twilio with basic auth."""
    resp = requests.get(
        media_url,
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.content


# ---------------------------------------------------------------------------
# Message handlers
# ---------------------------------------------------------------------------
async def _handle_text_message(phone: str, body: str) -> None:
    """Process a plain text WhatsApp message."""
    session = _get_session(phone)

    # Always detect language from incoming message
    session["language"] = ai_services.detect_language(body)
    logger.info("Session language set to '%s' for %s", session["language"], phone)

    language = session["language"]

    # Append user message to history
    session["history"].append({"role": "user", "content": body})

    # Build context from integration hooks
    extra_context = await _build_extra_context(phone)
    system_prompt = ai_services.build_system_prompt(language, extra_context)

    # Get LLM response
    reply = ai_services.get_llm_response(session["history"], system_prompt, language)

    # Send response
    send_whatsapp_message(phone, reply)

    # Append assistant response to history
    session["history"].append({"role": "assistant", "content": reply})


async def _handle_image_message(phone: str, body: str, media_url: str) -> None:
    """Process an image message — download, analyse, reply."""
    session = _get_session(phone)

    if body and body.strip():
        session["language"] = ai_services.detect_language(body)
    elif session["language"] is None:
        session["language"] = "en"

    language = session["language"]

    # Download image and encode as base64
    try:
        image_bytes = _download_twilio_media(media_url)
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
    except Exception:
        logger.exception("Failed to download image from %s", media_url)
        send_whatsapp_message(phone, "Sorry, I couldn't download the image. Please try again.")
        return

    # Analyse image
    user_question = body if body and body.strip() else ""
    analysis = ai_services.analyze_agriculture_image(b64_image, user_question, language)

    # Send response
    send_whatsapp_message(phone, analysis)

    # Update history
    session["history"].append(
        {
            "role": "user",
            "content": f"[Sent an image] {user_question}".strip(),
        }
    )
    session["history"].append({"role": "assistant", "content": analysis})


async def _handle_voice_message(phone: str, body: str, media_url: str, content_type: str) -> None:
    """Full voice pipeline: STT → LLM → text reply → TTS → audio reply."""
    session = _get_session(phone)

    # Step 1-2: Download and save audio
    ext = ".ogg" if "ogg" in content_type else ".mp3"
    tmp_audio_path = str(AUDIO_TMP_DIR / f"voice_{uuid.uuid4().hex}{ext}")

    try:
        audio_data = _download_twilio_media(media_url)
        with open(tmp_audio_path, "wb") as f:
            f.write(audio_data)
        logger.info("Voice audio saved to %s (%d bytes)", tmp_audio_path, len(audio_data))
    except Exception:
        logger.exception("Failed to download voice from %s", media_url)
        send_whatsapp_message(phone, "Sorry, I couldn't process your voice message.")
        return

    # Step 3: Transcribe
    transcript = ai_services.transcribe_audio(tmp_audio_path)
    if not transcript:
        send_whatsapp_message(phone, "Sorry, I couldn't understand the audio. Please try again.")
        _cleanup_file(tmp_audio_path)
        return

    # Step 4: Detect language from transcript ALWAYS
    session["language"] = ai_services.detect_language(transcript)
    logger.info("Session language set to '%s' via voice for %s", session["language"], phone)

    language = session["language"]

    # Step 5: Append transcription
    session["history"].append({"role": "user", "content": transcript})

    # Step 6: Get LLM response
    extra_context = await _build_extra_context(phone)
    system_prompt = ai_services.build_system_prompt(language, extra_context)
    reply = ai_services.get_llm_response(session["history"], system_prompt, language)

    # Step 7: Send text response immediately
    send_whatsapp_message(phone, f"🎤 _{transcript}_\n\n{reply}")

    # Step 8-9: Generate TTS audio
    tts_audio = ai_services.text_to_speech(reply, language)
    if tts_audio:
        audio_id = uuid.uuid4().hex
        wav_filename = f"response_{audio_id}.wav"
        wav_path = str(AUDIO_TMP_DIR / wav_filename)
        with open(wav_path, "wb") as f:
            f.write(tts_audio)

        # Convert WAV to MP4 (AAC) for WhatsApp compatibility (cross-platform)
        mp4_filename = f"response_{audio_id}.mp4"
        mp4_path = str(AUDIO_TMP_DIR / mp4_filename)
        audio_public_url = f"{NGROK_PUBLIC_URL}/audio/{wav_filename}"  # Default fallback

        import shutil
        import subprocess
        import sys

        if sys.platform == "darwin":
            # Mac OS built-in converter
            try:
                subprocess.run(
                    ["afconvert", "-f", "m4af", "-d", "aac", wav_path, mp4_path], check=True
                )
                audio_public_url = f"{NGROK_PUBLIC_URL}/audio/{mp4_filename}"
            except Exception as e:
                logger.warning("Mac audio conversion failed: %s", e)
        else:
            # Windows / Linux relies on FFmpeg
            if shutil.which("ffmpeg"):
                try:
                    subprocess.run(
                        ["ffmpeg", "-y", "-i", wav_path, "-c:a", "aac", "-b:a", "64k", mp4_path],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        check=True,
                    )
                    audio_public_url = f"{NGROK_PUBLIC_URL}/audio/{mp4_filename}"
                except Exception as e:
                    logger.warning("FFmpeg conversion failed: %s", e)
            else:
                logger.warning(
                    "FFmpeg not installed! Voice notes won't play correctly on WhatsApp on Windows. Please install FFmpeg."
                )

        # Step 10-11: Send audio via Twilio
        send_whatsapp_message(phone, "🔊", media_url=audio_public_url)
        logger.info("TTS audio sent: %s", audio_public_url)

        # Step 12: Cleanup is deferred — Twilio needs time to fetch the file.
        # In production, use a background task or TTL-based cleanup.
    else:
        logger.warning("TTS generation failed; text-only response sent")

    # Cleanup downloaded voice file
    _cleanup_file(tmp_audio_path)

    # Step 13: Append assistant response
    session["history"].append({"role": "assistant", "content": reply})


def _cleanup_file(path: str) -> None:
    """Remove a temp file, logging any errors."""
    try:
        os.unlink(path)
    except OSError:
        logger.warning("Could not remove temp file: %s", path)


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle."""
    logger.info("=" * 60)
    logger.info("  KisanMitra WhatsApp Service starting on port %d", PORT)
    logger.info("=" * 60)
    if NGROK_PUBLIC_URL:
        logger.info("  ngrok URL: %s", NGROK_PUBLIC_URL)
        logger.info("  Webhook:   %s/webhook", NGROK_PUBLIC_URL)
    else:
        logger.info("  ⚠  NGROK_PUBLIC_URL not set — run ngrok and update .env")
    logger.info("")
    logger.info("  Twilio Sandbox config:")
    logger.info("    1. Go to Twilio Console → Messaging → WhatsApp Sandbox")
    logger.info(
        "    2. Set 'When a message comes in' to: %s/webhook",
        NGROK_PUBLIC_URL or "https://<NGROK_URL>",
    )
    logger.info("    3. Method: HTTP POST")
    logger.info("=" * 60)
    yield
    logger.info("KisanMitra WhatsApp Service shutting down")


app = FastAPI(
    title="KisanMitra WhatsApp Service",
    description="WhatsApp Communication Intelligence Layer for PS-16 Marketplace",
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "kisanmitra-whatsapp"}


@app.get("/audio/{filename}")
async def serve_audio(filename: str):
    """Serve TTS audio files so Twilio can fetch them for media messages."""
    file_path = AUDIO_TMP_DIR / filename
    if not file_path.exists():
        return JSONResponse({"error": "File not found"}, status_code=404)
    if filename.endswith(".wav"):
        media_type = "audio/wav"
    elif filename.endswith(".mp4"):
        media_type = "audio/mp4"
    else:
        media_type = "audio/mpeg"
    return FileResponse(str(file_path), media_type=media_type, filename=filename)


@app.post("/webhook")
async def twilio_webhook(
    From: str = Form(""),
    Body: str = Form(""),
    NumMedia: int = Form(0),
    MediaUrl0: str = Form(""),
    MediaContentType0: str = Form(""),
):
    """
    Twilio WhatsApp webhook — receives all incoming messages and routes
    them to the appropriate handler based on media type.
    """
    phone = From
    body = Body.strip()
    logger.info(
        "Incoming | from=%s | body='%s' | media=%d | type=%s",
        phone,
        body[:50],
        NumMedia,
        MediaContentType0,
    )

    try:
        if NumMedia > 0 and MediaContentType0.startswith("image/"):
            await _handle_image_message(phone, body, MediaUrl0)

        elif NumMedia > 0 and MediaContentType0.startswith("audio/"):
            await _handle_voice_message(phone, body, MediaUrl0, MediaContentType0)

        elif body:
            await _handle_text_message(phone, body)

        else:
            # Edge case: no body and no supported media
            logger.warning("Unsupported message from %s (no text, unsupported media)", phone)
            send_whatsapp_message(
                phone,
                "Sorry, I can only process text, images, and voice messages right now.",
            )
    except Exception:
        logger.exception("Unhandled error processing message from %s", phone)
        send_whatsapp_message(phone, "Something went wrong. Please try again.")

    # Twilio expects a 200 response; an empty TwiML is fine when we send via API
    return JSONResponse({"status": "ok"})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "whatsapp_handler:app",
        host="0.0.0.0",
        port=PORT,
        reload=True,
    )
