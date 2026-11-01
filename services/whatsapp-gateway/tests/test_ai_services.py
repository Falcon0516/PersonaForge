from unittest.mock import MagicMock, patch

import ai_services


def test_build_system_prompt():
    prompt_en = ai_services.build_system_prompt("en", "Extra note")
    assert "KisanMitra" in prompt_en
    assert "English" in prompt_en
    assert "Extra note" in prompt_en

    prompt_hi = ai_services.build_system_prompt("hi")
    assert "Hindi" in prompt_hi

    prompt_kn = ai_services.build_system_prompt("kn")
    assert "Kannada" in prompt_kn


def test_detect_language_fallback():
    # Empty text
    assert ai_services.detect_language("") == "en"
    assert ai_services.detect_language("   ") == "en"


@patch("ai_services._get_groq_client")
def test_detect_language_success(mock_get_groq):
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "hi"
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp
    mock_get_groq.return_value = mock_client

    result = ai_services.detect_language("नमस्ते आप कैसे हैं")
    assert result == "hi"


@patch("ai_services._get_groq_client")
def test_get_llm_response_success(mock_get_groq):
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Namaste! How can I help you today?"
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp
    mock_get_groq.return_value = mock_client

    reply = ai_services.get_llm_response(
        [{"role": "user", "content": "Hello"}], "system prompt", "en"
    )
    assert reply == "Namaste! How can I help you today?"


@patch("ai_services._get_groq_client")
def test_get_llm_response_failure_fallback(mock_get_groq):
    mock_get_groq.side_effect = Exception("Groq network error")

    reply_en = ai_services.get_llm_response([], "system", "en")
    assert "trouble right now" in reply_en

    reply_hi = ai_services.get_llm_response([], "system", "hi")
    assert "कठिनाई" in reply_hi


@patch("ai_services._get_groq_client")
def test_analyze_agriculture_image_success(mock_get_groq):
    mock_client = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "This crop shows signs of nitrogen deficiency."
    mock_resp = MagicMock()
    mock_resp.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_resp
    mock_get_groq.return_value = mock_client

    result = ai_services.analyze_agriculture_image(
        "fakebase64", "What is wrong with my plant?", "en"
    )
    assert "nitrogen deficiency" in result


@patch("ai_services.requests.post")
@patch.dict("os.environ", {"SARVAM_API_KEY": "mock_key"})
def test_transcribe_audio_success(mock_post, tmp_path):
    audio_file = tmp_path / "test.ogg"
    audio_file.write_bytes(b"dummy audio data")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"transcript": "tamatar ka daam kya hai"}
    mock_post.return_value = mock_resp

    transcript = ai_services.transcribe_audio(str(audio_file))
    assert transcript == "tamatar ka daam kya hai"


@patch("ai_services.requests.post")
@patch.dict("os.environ", {"SARVAM_API_KEY": "mock_key"})
def test_text_to_speech_success(mock_post):
    import base64

    sample_wav = b"RIFF....WAVEfmt "
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"audios": [base64.b64encode(sample_wav).decode("utf-8")]}
    mock_post.return_value = mock_resp

    audio_bytes = ai_services.text_to_speech("Hello farmer", "en")
    assert audio_bytes == sample_wav
