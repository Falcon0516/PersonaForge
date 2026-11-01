"""
ai_services.py — All external AI service integrations for the WhatsApp
Communication Intelligence Layer (PS-16 Farmer Marketplace).

Services:
  - Groq LLM (chat completions)
  - Groq Vision API (image analysis)
  - Sarvam AI STT (speech-to-text)
  - Sarvam AI TTS (text-to-speech)
  - Language detection via Groq

This module has ZERO FastAPI imports — every function is independently testable.
"""

import base64
import logging
import os
from typing import Optional

import requests
from groq import Groq

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
GROQ_LLM_MODEL = os.getenv("GROQ_DEFAULT_MODEL", "qwen/qwen3.8-27b")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
GROQ_VISION_FALLBACK = "llama-3.2-11b-vision-preview"

GROQ_CANDIDATE_MODELS = [
    os.getenv("GROQ_DEFAULT_MODEL", "qwen/qwen3.8-27b"),
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
]

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
SARVAM_STT_MODEL = "saarika:v2.5"
SARVAM_TTS_MODEL = "bulbul:v3"

LANGUAGE_MAP = {
    "en": {"bcp47": "en-IN", "name": "English", "tts_speaker": "shruti"},
    "hi": {"bcp47": "hi-IN", "name": "Hindi", "tts_speaker": "shruti"},
    "kn": {"bcp47": "kn-IN", "name": "Kannada", "tts_speaker": "shruti"},
}

HTTP_TIMEOUT = 30  # seconds

# ---------------------------------------------------------------------------
# System prompt template
# ---------------------------------------------------------------------------
SYSTEM_PROMPT_TEMPLATE = """You are KisanMitra, a friendly and knowledgeable agricultural assistant for Indian farmers.
You work for a direct-to-consumer fresh produce marketplace that connects farmers directly with consumers, eliminating middlemen.

You help farmers with:
- Crop health, pest control, and farming best practices
- Current market prices for produce (provide estimated mandi rates if exact data unavailable)
- Order status and logistics tracking (if order data is passed in context, reference it)
- Community bulk basket orders and how to pool with neighboring farmers
- Produce listing advice (what price to set, how to describe quality)
- Weather-based cultivation advice
- Government schemes and subsidies for farmers

CRITICAL RULES:
1. You MUST respond ONLY in {language_name}. Do not mix languages.
2. Keep responses SHORT and SIMPLE — farmers use WhatsApp on basic smartphones.
3. Use simple vocabulary, avoid jargon.
4. Be warm, respectful, and encouraging — address farmer as "anna" (Kannada), "bhai" (Hindi), or by name.
5. For image analysis, be specific about what you see and give actionable advice.
6. If asked about order tracking or pricing, note what data you have access to and what would need to be fetched from the marketplace backend.

{extra_context}"""


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------
def _get_groq_client() -> Groq:
    """Fetch Groq client supporting either GROQ_API_KEY or GROQ_API_KEYS (comma-separated)."""
    raw_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ_API_KEYS", "")
    api_key = raw_key.split(",")[0].strip() if raw_key else ""
    if not api_key:
        raise RuntimeError("Neither GROQ_API_KEY nor GROQ_API_KEYS environment variable is set")
    return Groq(api_key=api_key)


def _get_sarvam_headers() -> dict:
    raw_key = os.getenv("SARVAM_API_KEY") or os.getenv("SARVAM_API_KEYS", "")
    api_key = raw_key.split(",")[0].strip() if raw_key else ""
    if not api_key:
        raise RuntimeError("SARVAM_API_KEY environment variable is not set")
    return {"API-Subscription-Key": api_key}


# ---------------------------------------------------------------------------
# Public: build system prompt
# ---------------------------------------------------------------------------
def build_system_prompt(language: str, extra_context: str = "") -> str:
    """Build the full KisanMitra system prompt for the given language."""
    lang_info = LANGUAGE_MAP.get(language, LANGUAGE_MAP["en"])
    return SYSTEM_PROMPT_TEMPLATE.format(
        language_name=lang_info["name"],
        extra_context=extra_context,
    )


# ---------------------------------------------------------------------------
# Language detection
# ---------------------------------------------------------------------------
def detect_language(text: str) -> str:
    """Detect whether *text* is English, Hindi, or Kannada with auto-fallback."""
    if not text or not text.strip():
        return "en"

    # Fast script heuristics
    if any("\u0900" <= ch <= "\u097f" for ch in text):
        return "hi"
    if any("\u0c80" <= ch <= "\u0cff" for ch in text):
        return "kn"

    # Deduplicated list of models to try
    seen = set()
    models = [m for m in GROQ_CANDIDATE_MODELS if m and not (m in seen or seen.add(m))]

    for model_name in models:
        try:
            client = _get_groq_client()
            resp = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a language identification tool. "
                            "Identify the language of the following text. "
                            "Return ONLY one word: 'en' for English, 'hi' for Hindi, "
                            "'kn' for Kannada. Do not return anything else."
                        ),
                    },
                    {"role": "user", "content": text},
                ],
                max_tokens=5,
                temperature=0,
            )
            detected = resp.choices[0].message.content.strip().lower()
            if detected in ("en", "hi", "kn"):
                logger.info("Detected language '%s' using %s", detected, model_name)
                return detected
        except Exception as e:
            logger.warning("Language detection failed on %s: %s", model_name, e)

    return "en"


# ---------------------------------------------------------------------------
# LLM chat completion
# ---------------------------------------------------------------------------
def get_llm_response(history: list[dict], system_prompt: str, language: str) -> str:
    """Generate a chat response using Groq LLM with full conversation history and multi-model fallback."""
    seen = set()
    models = [m for m in GROQ_CANDIDATE_MODELS if m and not (m in seen or seen.add(m))]

    try:
        client = _get_groq_client()
    except Exception as e:
        logger.exception("Failed to initialize Groq client: %s", e)
        fallback = {
            "en": "I'm sorry, I'm having trouble right now. Please try again shortly.",
            "hi": "क्षमा करें, अभी कठिनाई हो रही है। कृपया कुछ समय बाद पुनः प्रयास करें।",
            "kn": "ಕ್ಷಮಿಸಿ, ಈಗ ಕಷ್ಟವಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
        }
        return fallback.get(language, fallback["en"])

    messages = [{"role": "system", "content": system_prompt}] + history

    for model_name in models:
        try:
            resp = client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )
            reply = resp.choices[0].message.content.strip()
            logger.info("LLM response generated with model %s (%d chars)", model_name, len(reply))
            return reply
        except Exception as e:
            logger.warning("Groq call failed with model %s: %s. Trying fallback model...", model_name, e)

    logger.exception("All Groq models failed in get_llm_response")
    fallback = {
        "en": "I'm sorry, I'm having trouble right now. Please try again shortly.",
        "hi": "क्षमा करें, अभी कठिनाई हो रही है। कृपया कुछ समय बाद पुनः प्रयास करें।",
        "kn": "ಕ್ಷಮಿಸಿ, ಈಗ ಕಷ್ಟವಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    }
    return fallback.get(language, fallback["en"])


# ---------------------------------------------------------------------------
# Image analysis (Groq Vision)
# ---------------------------------------------------------------------------
def analyze_agriculture_image(base64_image: str, user_question: str, language: str) -> str:
    """Analyse a crop/farm image via Groq Vision API and return advice."""
    lang_info = LANGUAGE_MAP.get(language, LANGUAGE_MAP["en"])
    if not user_question or not user_question.strip():
        user_question = "Analyze this agricultural image and provide relevant advice for a farmer."

    system_content = (
        "You are an expert agricultural advisor with deep knowledge of Indian crops, "
        "pests, soil conditions, and farming practices. Analyze the provided image and "
        "give specific, actionable advice. "
        f"You MUST respond ONLY in {lang_info['name']}. "
        "Keep your response concise and farmer-friendly."
    )

    for model_name in [GROQ_VISION_MODEL, GROQ_VISION_FALLBACK]:
        try:
            client = _get_groq_client()
            resp = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_content},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                            {"type": "text", "text": user_question},
                        ],
                    },
                ],
                max_tokens=500,
                temperature=0.5,
            )
            analysis = resp.choices[0].message.content.strip()
            logger.info("Image analysis completed with %s (%d chars)", model_name, len(analysis))
            return analysis
        except Exception:
            logger.warning("Groq Vision API call with model %s failed, trying fallback", model_name)

    logger.exception("All Groq Vision models failed")
    fallback = {
        "en": "I'm sorry, I couldn't analyze the image right now. Please try again.",
        "hi": "क्षमा करें, छवि का विश्लेषण नहीं हो पाया। कृपया पुनः प्रयास करें।",
        "kn": "ಕ್ಷಮಿಸಿ, ಚಿತ್ರ ವಿಶ್ಲೇಷಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    }
    return fallback.get(language, fallback["en"])


# ---------------------------------------------------------------------------
# Speech-to-text (Sarvam AI)
# ---------------------------------------------------------------------------
def transcribe_audio(audio_file_path: str) -> str:
    """Transcribe an audio file (.ogg/.mp3/.wav) using Sarvam AI STT."""
    try:
        headers = _get_sarvam_headers()
        import mimetypes

        mime_type, _ = mimetypes.guess_type(audio_file_path)
        if not mime_type:
            mime_type = "audio/ogg" if audio_file_path.endswith(".ogg") else "audio/mpeg"

        with open(audio_file_path, "rb") as f:
            files = {"file": (os.path.basename(audio_file_path), f, mime_type)}
            data = {"language_code": "unknown", "model": SARVAM_STT_MODEL}
            resp = requests.post(
                SARVAM_STT_URL,
                headers=headers,
                files=files,
                data=data,
                timeout=HTTP_TIMEOUT,
            )
            if resp.status_code != 200:
                logger.error("Sarvam STT failed with %s: %s", resp.status_code, resp.text)
            resp.raise_for_status()
        transcript = resp.json().get("transcript", "")
        logger.info("Audio transcribed (%d chars): %s…", len(transcript), transcript[:80])
        return transcript
    except Exception:
        logger.exception("Sarvam STT failed for %s", audio_file_path)
        return ""


# ---------------------------------------------------------------------------
# Text-to-speech (Sarvam AI)
# ---------------------------------------------------------------------------
def text_to_speech(text: str, language: str) -> Optional[bytes]:
    """Convert text to speech via Sarvam AI TTS. Returns WAV bytes or None."""
    lang_info = LANGUAGE_MAP.get(language, LANGUAGE_MAP["en"])
    payload = {
        "inputs": [text],
        "target_language_code": lang_info["bcp47"],
        "speaker": lang_info["tts_speaker"],
        "model": SARVAM_TTS_MODEL,
        "pace": 1.0,
        "enable_preprocessing": True,
    }
    try:
        headers = _get_sarvam_headers()
        headers["Content-Type"] = "application/json"
        resp = requests.post(
            SARVAM_TTS_URL,
            headers=headers,
            json=payload,
            timeout=HTTP_TIMEOUT,
        )
        if resp.status_code != 200:
            logger.error("Sarvam TTS failed with %s: %s", resp.status_code, resp.text)
        resp.raise_for_status()
        audios = resp.json().get("audios")
        if audios and len(audios) > 0:
            audio_bytes = base64.b64decode(audios[0])
            logger.info("TTS audio generated (%d bytes)", len(audio_bytes))
            return audio_bytes
        logger.warning("Sarvam TTS returned empty audios list")
        return None
    except Exception:
        logger.exception("Sarvam TTS call failed")
        return None
