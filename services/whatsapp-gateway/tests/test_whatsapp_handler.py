from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from whatsapp_handler import (
    AUDIO_TMP_DIR,
    _downscale_image,
    app,
    split_whatsapp_message,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["bots_supported"] >= 5


def test_audio_serve_404(client):
    response = client.get("/audio/nonexistent_file.wav")
    assert response.status_code == 404


def test_audio_serve_invalid_regex(client):
    # Invalid character injection attempt
    response = client.get("/audio/invalid$file!#%.wav")
    assert response.status_code == 400


def test_audio_serve_success(client):
    test_file = AUDIO_TMP_DIR / "sample_audio.wav"
    test_file.write_bytes(b"dummy wav data")
    try:
        response = client.get("/audio/sample_audio.wav")
        assert response.status_code == 200
        assert response.content == b"dummy wav data"
    finally:
        if test_file.exists():
            test_file.unlink()


def test_split_whatsapp_message_short():
    short_text = "Short message under 1500 chars."
    chunks = split_whatsapp_message(short_text, max_length=1500)
    assert chunks == [short_text]


def test_split_whatsapp_message_long():
    long_text = "This is a sentence. " * 150  # ~3000 chars
    chunks = split_whatsapp_message(long_text, max_length=1500)
    assert len(chunks) >= 2
    for c in chunks:
        assert len(c) <= 1500


def test_image_downscaling():
    from io import BytesIO

    from PIL import Image

    # Create dummy large 2000x2000 image
    img = Image.new("RGB", (2000, 2000), color="blue")
    buf = BytesIO()
    img.save(buf, format="JPEG")
    large_bytes = buf.getvalue()

    downscaled = _downscale_image(large_bytes, max_dim=1280)
    res_img = Image.open(BytesIO(downscaled))
    assert res_img.width <= 1280
    assert res_img.height <= 1280


@patch("whatsapp_handler.send_whatsapp_message")
@patch("ai_services.get_llm_response")
@patch("ai_services.detect_language")
def test_webhook_text_message(mock_detect, mock_llm, mock_send, client):
    mock_detect.return_value = "en"
    mock_llm.return_value = "Tomato rate is 25 Rs per kg."
    mock_send.return_value = True

    response = client.post(
        "/webhook",
        data={
            "From": "whatsapp:+919876543210",
            "Body": "What is the tomato rate?",
            "NumMedia": "0",
        },
    )
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    mock_send.assert_called_once()
    assert "whatsapp:+919876543210" in mock_send.call_args[0][0]
    assert "Tomato rate is 25 Rs" in mock_send.call_args[0][1]


@patch("whatsapp_handler.send_whatsapp_message")
def test_webhook_multi_bot_commands(mock_send, client):
    mock_send.return_value = True

    # 1. /bots
    res = client.post(
        "/webhook",
        data={
            "From": "whatsapp:+919999999999",
            "Body": "/bots",
            "NumMedia": "0",
        },
    )
    assert res.status_code == 200
    assert "PersonaForge Multi-Tenant Bots" in mock_send.call_args[0][1]

    # 2. /use shop
    res = client.post(
        "/webhook",
        data={
            "From": "whatsapp:+919999999999",
            "Body": "/use shop",
            "NumMedia": "0",
        },
    )
    assert res.status_code == 200
    assert "Switched to SwiftCart" in mock_send.call_args[0][1]

    # 3. /reset
    res = client.post(
        "/webhook",
        data={
            "From": "whatsapp:+919999999999",
            "Body": "/reset",
            "NumMedia": "0",
        },
    )
    assert res.status_code == 200
    assert "Conversation reset" in mock_send.call_args[0][1]


@patch("whatsapp_handler.send_whatsapp_message")
@patch("whatsapp_handler._download_twilio_media")
@patch("ai_services.analyze_agriculture_image")
def test_webhook_image_message(mock_analyze, mock_download, mock_send, client):
    from io import BytesIO

    from PIL import Image

    img = Image.new("RGB", (100, 100), color="green")
    buf = BytesIO()
    img.save(buf, format="JPEG")

    mock_download.return_value = buf.getvalue()
    mock_analyze.return_value = "Looks like early blight."
    mock_send.return_value = True

    response = client.post(
        "/webhook",
        data={
            "From": "whatsapp:+919876543210",
            "Body": "Check my plant",
            "NumMedia": "1",
            "MediaUrl0": "https://api.twilio.com/mock/image",
            "MediaContentType0": "image/jpeg",
        },
    )
    assert response.status_code == 200
    mock_analyze.assert_called_once()
    mock_send.assert_called_once()
    assert "blight" in mock_send.call_args[0][1]
