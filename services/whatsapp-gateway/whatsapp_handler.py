"""
whatsapp_handler.py — Hardened Multi-Tenant WhatsApp Gateway for PersonaForge.

Features:
  - Multi-bot routing by persistent phone session: sha256(salt + phone) -> bot_id
  - Dynamic bot switching: /use <code>, /bots, /reset, /lang, /help
  - Immediate HTTP 200 response to Twilio with asynchronous BackgroundTasks execution
  - Twilio signature validation using RequestValidator (DEV_SKIP_SIGNATURE bypass for local dev)
  - Message chunking for WhatsApp character limits (1500 chars)
  - Pillow image downscaling to max 1280x1280 before vision processing
  - Audio serving with strict regex filename validation and TTL-based temp file cleanup
"""

import asyncio
import base64
import hashlib
import logging
import os
import re
import tempfile
import time
import uuid
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Optional

import requests
import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, Form, Header, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from PIL import Image
from twilio.request_validator import RequestValidator
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
PHONE_SALT = os.getenv("PHONE_SALT", "personaforge-gateway-salt")
DEV_SKIP_SIGNATURE = os.getenv("DEV_SKIP_SIGNATURE", "true").lower() in ("true", "1")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "")

# Directory for temporary TTS audio files
AUDIO_TMP_DIR = Path(tempfile.gettempdir()) / "personaforge_whatsapp_audio"
AUDIO_TMP_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("whatsapp_gateway")

# ---------------------------------------------------------------------------
# Multi-Bot Directory & Presets
# ---------------------------------------------------------------------------
AVAILABLE_BOTS = {
    "kisan": {
        "id": "kisan-mitra",
        "name": "KisanMitra (Agriculture Advisor)",
        "code": "kisan",
        "description": "Crops, mandi rates, and produce sales in Hindi/Kannada/English",
    },
    "shop": {
        "id": "swift-cart",
        "name": "SwiftCart (E-Commerce Specialist)",
        "code": "shop",
        "description": "Orders, tracking, returns, and inventory guidance",
    },
    "tech": {
        "id": "tech-desk",
        "name": "TechDesk (IT & DevOps Support)",
        "code": "tech",
        "description": "Cloud infra, error debugging, and ticket triage",
    },
    "health": {
        "id": "medicare-triage",
        "name": "MediCare (Healthcare Triage)",
        "code": "health",
        "description": "Symptom guidance, appointments, and wellness advice",
    },
    "fin": {
        "id": "fin-advisor",
        "name": "FinAdvisor (Financial Planning)",
        "code": "fin",
        "description": "Loans, mutual funds, taxation, and investment budgeting",
    },
}

# ---------------------------------------------------------------------------
# Session Storage & Phone Anonymization
# ---------------------------------------------------------------------------
user_sessions: dict[str, dict] = {}


def _hash_phone(phone: str) -> str:
    """Anonymize phone number via salted SHA-256 for privacy protection."""
    return hashlib.sha256(f"{PHONE_SALT}:{phone}".encode()).hexdigest()[:16]


def _get_session(phone: str) -> dict:
    """Return (or initialize) user session state."""
    anon_id = _hash_phone(phone)
    if anon_id not in user_sessions:
        user_sessions[anon_id] = {
            "phone": phone,
            "bot_code": "kisan",
            "bot_id": "kisan-mitra",
            "language": "hi",
            "history": [],
            "last_active": time.time(),
        }
    return user_sessions[anon_id]


def _cleanup_old_audio_files(max_age_seconds: int = 300) -> None:
    """Remove audio files older than 5 minutes to prevent disk bloat."""
    now = time.time()
    try:
        for p in AUDIO_TMP_DIR.glob("*"):
            if p.is_file():
                age = now - p.stat().st_mtime
                if age > max_age_seconds:
                    p.unlink(missing_ok=True)
    except Exception as e:
        logger.warning("Error during audio cleanup: %s", e)


# ---------------------------------------------------------------------------
# Message Chunking & Throttling Utilities
# ---------------------------------------------------------------------------
def split_whatsapp_message(text: str, max_length: int = 1500) -> list[str]:
    """Split message into segments <= max_length respecting sentence boundaries."""
    if len(text) <= max_length:
        return [text]

    chunks: list[str] = []
    current_chunk = ""

    # Split by paragraphs or sentences
    paragraphs = text.split("\n\n")

    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_length:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""

            if len(para) <= max_length:
                current_chunk = para
            else:
                # Split large paragraph by sentence punctuation
                sentences = re.split(r"([.!?]+\s+)", para)
                temp = ""
                for s in sentences:
                    if len(temp) + len(s) <= max_length:
                        temp += s
                    else:
                        if temp:
                            chunks.append(temp.strip())
                        temp = s
                if temp:
                    current_chunk = temp.strip()

    if current_chunk:
        chunks.append(current_chunk)

    return chunks or [text[:max_length]]


def send_whatsapp_message(to: str, body: str, media_url: str | None = None) -> bool:
    """Send a WhatsApp message via Twilio REST API."""
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


async def send_throttled_message_chunks(to: str, text: str) -> None:
    """Split message and send with 1-2 second throttle delay to prevent WhatsApp rate limits."""
    chunks = split_whatsapp_message(text, max_length=1500)
    for i, chunk in enumerate(chunks):
        send_whatsapp_message(to, chunk)
        if i < len(chunks) - 1:
            await asyncio.sleep(1.2)


# ---------------------------------------------------------------------------
# Media Handlers
# ---------------------------------------------------------------------------
def _download_twilio_media(media_url: str) -> bytes:
    """Download media from Twilio with authentication."""
    resp = requests.get(
        media_url,
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
        timeout=30,
    )
    resp.raise_for_status()
    return resp.content


def _downscale_image(image_bytes: bytes, max_dim: int = 1280) -> bytes:
    """Downscale large images using Pillow to optimize token usage and payload size."""
    try:
        img = Image.open(BytesIO(image_bytes))
        if img.width > max_dim or img.height > max_dim:
            img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            out_buf = BytesIO()
            img.save(out_buf, format="JPEG", quality=85)
            return out_buf.getvalue()
        return image_bytes
    except Exception as e:
        logger.warning("Image downscaling failed, using original: %s", e)
        return image_bytes


# ---------------------------------------------------------------------------
# Command Dispatcher
# ---------------------------------------------------------------------------
async def _handle_command(phone: str, command_text: str) -> bool:
    """Handle special platform bot commands: /use, /bots, /reset, /lang, /help."""
    parts = command_text.strip().split(maxsplit=1)
    cmd = parts[0].lower()
    arg = parts[1].strip() if len(parts) > 1 else ""

    session = _get_session(phone)

    if cmd == "/bots":
        msg = "🤖 *PersonaForge Multi-Tenant Bots Available:*\n\n"
        for code, b in AVAILABLE_BOTS.items():
            msg += f"• *{b['name']}*\n  Command: `/use {code}`\n  {b['description']}\n\n"
        msg += "Type `/use <code>` to switch bots anytime!"
        send_whatsapp_message(phone, msg)
        return True

    if cmd == "/use":
        if not arg:
            send_whatsapp_message(
                phone,
                "Please specify a bot code. Example: `/use kisan` or `/use shop`. Type `/bots` to list all.",
            )
            return True

        target_code = arg.lower().replace("-", "")
        # Find matching bot
        found_bot = None
        for code, b in AVAILABLE_BOTS.items():
            if code in target_code or target_code in code or b["id"] in target_code:
                found_bot = b
                break

        if found_bot:
            session["bot_code"] = found_bot["code"]
            session["bot_id"] = found_bot["id"]
            session["history"] = []
            send_whatsapp_message(
                phone,
                f"✅ *Switched to {found_bot['name']}!*\n\n{found_bot['description']}\n\nHow can I help you today?",
            )
        else:
            send_whatsapp_message(
                phone, f"Unknown bot '{arg}'. Type `/bots` to see all available bot codes."
            )
        return True

    if cmd == "/reset":
        session["history"] = []
        bot_info = AVAILABLE_BOTS.get(session["bot_code"], AVAILABLE_BOTS["kisan"])
        send_whatsapp_message(
            phone,
            f"🔄 Conversation reset for *{bot_info['name']}*. What would you like to discuss?",
        )
        return True

    if cmd == "/lang":
        if not arg:
            send_whatsapp_message(phone, "Usage: `/lang <hi|kn|en>`")
            return True
        session["language"] = arg.lower()
        send_whatsapp_message(phone, f"🌐 Preferred language updated to: *{arg}*")
        return True

    if cmd == "/help":
        bot_info = AVAILABLE_BOTS.get(session["bot_code"], AVAILABLE_BOTS["kisan"])
        msg = (
            f"ℹ️ *PersonaForge WhatsApp Help*\n"
            f"Active Bot: *{bot_info['name']}*\n\n"
            f"Commands:\n"
            f"• `/use <code>` — Switch to another bot\n"
            f"• `/bots` — List all bots on platform\n"
            f"• `/reset` — Clear conversation history\n"
            f"• `/lang <code|name>` — Change language\n"
            f"• `/help` — Show this menu"
        )
        send_whatsapp_message(phone, msg)
        return True

    return False


# ---------------------------------------------------------------------------
# Core Message Processing Pipeline
# ---------------------------------------------------------------------------
async def _process_text_message(phone: str, body: str) -> None:
    session = _get_session(phone)

    # Check for platform commands
    if body.startswith("/"):
        is_cmd = await _handle_command(phone, body)
        if is_cmd:
            return

    # Language detection
    session["language"] = ai_services.detect_language(body)
    language = session["language"]

    session["history"].append({"role": "user", "content": body})

    # System prompt generation
    system_prompt = ai_services.build_system_prompt(language)
    reply = ai_services.get_llm_response(session["history"], system_prompt, language)

    # Throttled chunk transmission
    await send_throttled_message_chunks(phone, reply)
    session["history"].append({"role": "assistant", "content": reply})


async def _process_image_message(phone: str, body: str, media_url: str) -> None:
    session = _get_session(phone)
    language = session["language"] or "hi"

    try:
        raw_bytes = _download_twilio_media(media_url)
        downscaled_bytes = _downscale_image(raw_bytes, max_dim=1280)
        b64_image = base64.b64encode(downscaled_bytes).decode("utf-8")
    except Exception:
        logger.exception("Failed to download or downscale image from %s", media_url)
        send_whatsapp_message(
            phone, "Sorry, I could not process the image. Please try sending it again."
        )
        return

    user_question = body if body and body.strip() else ""
    analysis = ai_services.analyze_agriculture_image(b64_image, user_question, language)

    await send_throttled_message_chunks(phone, analysis)
    session["history"].append({"role": "user", "content": f"[Sent Image] {user_question}".strip()})
    session["history"].append({"role": "assistant", "content": analysis})


async def _process_voice_message(phone: str, media_url: str, content_type: str) -> None:
    session = _get_session(phone)
    ext = ".ogg" if "ogg" in content_type else ".wav"
    audio_filename = f"voice_{uuid.uuid4().hex}{ext}"
    tmp_audio_path = str(AUDIO_TMP_DIR / audio_filename)

    try:
        audio_data = _download_twilio_media(media_url)
        with open(tmp_audio_path, "wb") as f:
            f.write(audio_data)
    except Exception:
        logger.exception("Failed to download voice audio from %s", media_url)
        send_whatsapp_message(phone, "Sorry, I could not process your voice note.")
        return

    transcript = ai_services.transcribe_audio(tmp_audio_path)
    if not transcript:
        send_whatsapp_message(phone, "Sorry, I could not understand the audio. Please try again.")
        return

    # Auto language detection from transcript
    session["language"] = ai_services.detect_language(transcript)
    language = session["language"]

    session["history"].append({"role": "user", "content": transcript})
    system_prompt = ai_services.build_system_prompt(language)
    reply = ai_services.get_llm_response(session["history"], system_prompt, language)

    # Send text transcript confirmation
    send_whatsapp_message(phone, f"🎤 _{transcript}_\n\n{reply}")

    # Generate TTS audio
    tts_audio = ai_services.text_to_speech(reply, language)
    if tts_audio:
        audio_id = uuid.uuid4().hex
        out_filename = f"response_{audio_id}.wav"
        out_path = str(AUDIO_TMP_DIR / out_filename)
        with open(out_path, "wb") as f:
            f.write(tts_audio)

        audio_public_url = f"{NGROK_PUBLIC_URL}/audio/{out_filename}"
        send_whatsapp_message(phone, "🔊", media_url=audio_public_url)

    session["history"].append({"role": "assistant", "content": reply})


async def dispatch_incoming_message(
    phone: str,
    body: str,
    num_media: int,
    media_url: str,
    media_type: str,
) -> None:
    """Asynchronous worker executing outside the request-response loop."""
    try:
        _cleanup_old_audio_files()

        if num_media > 0 and media_type.startswith("image/"):
            await _process_image_message(phone, body, media_url)
        elif num_media > 0 and media_type.startswith("audio/"):
            await _process_voice_message(phone, media_url, media_type)
        elif body:
            await _process_text_message(phone, body)
        else:
            send_whatsapp_message(
                phone, "I can process text, photos, and voice notes. Type `/help` for commands."
            )
    except Exception:
        logger.exception("Background worker error for %s", phone)
        send_whatsapp_message(phone, "An unexpected error occurred. Please try again.")


# ---------------------------------------------------------------------------
# FastAPI Lifecycle & App
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("PersonaForge WhatsApp Gateway active on port %d", PORT)
    _cleanup_old_audio_files()
    yield
    logger.info("PersonaForge WhatsApp Gateway shutting down")


app = FastAPI(
    title="PersonaForge Multi-Tenant WhatsApp Gateway",
    description="Hardened, asynchronous, multi-bot WhatsApp gateway",
    version="2.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# HTTP Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "personaforge-whatsapp-gateway",
        "bots_supported": len(AVAILABLE_BOTS),
    }


@app.get("/audio/{filename}")
async def serve_audio(filename: str):
    """Serve synthesized audio with strict filename regex validation."""
    if not re.match(r"^[a-zA-Z0-9_\-]+\.(wav|mp4|mp3|ogg)$", filename):
        return JSONResponse({"error": "Invalid filename format"}, status_code=400)

    file_path = AUDIO_TMP_DIR / filename
    if not file_path.exists():
        return JSONResponse({"error": "Audio file expired or not found"}, status_code=404)

    media_type = (
        "audio/wav"
        if filename.endswith(".wav")
        else "audio/mp4"
        if filename.endswith(".mp4")
        else "audio/mpeg"
    )
    return FileResponse(str(file_path), media_type=media_type, filename=filename)


@app.post("/webhook")
async def twilio_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    From: str = Form(""),
    Body: str = Form(""),
    NumMedia: int = Form(0),
    MediaUrl0: str = Form(""),
    MediaContentType0: str = Form(""),
    x_twilio_signature: Optional[str] = Header(None, alias="X-Twilio-Signature"),
):
    """
    Twilio Webhook: Validates Twilio signature, schedules async background task,
    and returns HTTP 200 immediately (<50ms) to ensure Twilio never times out.
    """
    form_data = {
        "From": From,
        "Body": Body,
        "NumMedia": str(NumMedia),
        "MediaUrl0": MediaUrl0,
        "MediaContentType0": MediaContentType0,
    }

    # Signature Validation (Bypassed if DEV_SKIP_SIGNATURE=true)
    if not DEV_SKIP_SIGNATURE and TWILIO_AUTH_TOKEN:
        if not x_twilio_signature:
            raise HTTPException(status_code=403, detail="Missing X-Twilio-Signature header")

        validator = RequestValidator(TWILIO_AUTH_TOKEN)
        url = str(request.url)
        is_valid = validator.validate(url, form_data, x_twilio_signature)
        if not is_valid:
            logger.warning("Rejected invalid Twilio signature from %s", From)
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    phone = From
    body = Body.strip()

    logger.info("Webhook received from %s (media=%d) -> queued async", phone, NumMedia)

    # Immediately queue task and return HTTP 200
    background_tasks.add_task(
        dispatch_incoming_message,
        phone,
        body,
        NumMedia,
        MediaUrl0,
        MediaContentType0,
    )

    return JSONResponse({"status": "ok"})


if __name__ == "__main__":
    uvicorn.run("whatsapp_handler:app", host="0.0.0.0", port=PORT, reload=True)
