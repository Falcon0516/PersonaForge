from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from whatsapp_handler import AUDIO_TMP_DIR, app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_audio_serve_404(client):
    response = client.get("/audio/nonexistent_file.wav")
    assert response.status_code == 404


def test_audio_serve_success(client, tmp_path):
    test_file = AUDIO_TMP_DIR / "sample_audio.wav"
    test_file.write_bytes(b"dummy wav data")
    try:
        response = client.get("/audio/sample_audio.wav")
        assert response.status_code == 200
        assert response.content == b"dummy wav data"
    finally:
        if test_file.exists():
            test_file.unlink()


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
@patch("whatsapp_handler._download_twilio_media")
@patch("ai_services.analyze_agriculture_image")
def test_webhook_image_message(mock_analyze, mock_download, mock_send, client):
    mock_download.return_value = b"fake-image-bytes"
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
