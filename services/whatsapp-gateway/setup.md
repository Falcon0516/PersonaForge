# KisanMitra WhatsApp AI Integration - Setup Guide

This guide provides step-by-step instructions to completely set up the KisanMitra WhatsApp AI Bot on a local machine. It covers both **Windows** and **Mac**.

---

## 1. Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Python**: Ensure Python 3.10 or newer is installed.
  - *Windows*: Download from [python.org](https://www.python.org/downloads/). Ensure you check the box **"Add Python to PATH"** during installation.
  - *Mac*: Python 3 usually comes pre-installed, or can be installed via `brew install python`.
- **Ngrok**: Used to create a public URL for the WhatsApp Webhook.
  - *Windows & Mac*: Sign up at [ngrok.com](https://ngrok.com/) and follow their dashboard instructions to install it on your OS.
- **FFmpeg (Crucial for Windows)**: Used to convert audio voice notes so WhatsApp can play them.
  - *Mac*: You don't need this, Mac uses its built-in `afconvert`.
  - *Windows*: 
    1. Download the FFmpeg executable from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip).
    2. Extract the folder, rename it to `ffmpeg`, and put it in your `C:\` drive (e.g., `C:\ffmpeg`).
    3. Add `C:\ffmpeg\bin` to your System Environment Variables under "Path". (Search Windows for "Edit the system environment variables").
    4. Restart your terminal to apply changes.

---

## 2. Install Dependencies

Open a terminal (Command Prompt or PowerShell on Windows, Terminal on Mac), navigate to the project folder, and run:

```bash
# It is highly recommended to use a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac:
source venv/bin/activate

# Install the required Python packages
pip install -r requirements.txt
```

---

## 3. Configuration (.env file)

Open the `.env` file in the project folder and fill in the required API keys.

```env
# Twilio Configuration
# Get these from your Twilio Console (https://console.twilio.com/)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886 # This is usually Twilio's Sandbox number

# AI Providers
GROQ_API_KEY=your_groq_api_key_here
SARVAM_API_KEY=your_sarvam_api_key_here

# The Node.js Backend URL where farmer data is stored
BACKEND_BASE_URL=http://localhost:3000

# Ngrok Public URL (We will fill this in the next step!)
NGROK_PUBLIC_URL=
```

---

## 4. Run Ngrok

Twilio requires a public `https` URL to talk to our local Python server. We use Ngrok for this.

1. Open a **new, separate terminal window**.
2. Run the following command:
   ```bash
   ngrok http 8000
   ```
3. Ngrok will start running and display a "Forwarding" URL (e.g., `https://1a2b-3c-4d.ngrok-free.app`).
4. **Copy this URL**.
5. Paste it into your `.env` file as `NGROK_PUBLIC_URL=https://1a2b-3c-4d.ngrok-free.app`. **Do not add a trailing slash (/).**

---

## 5. Configure Twilio WhatsApp Sandbox

Now we need to tell Twilio where to send the WhatsApp messages.

1. Log into the [Twilio Console](https://console.twilio.com/).
2. Navigate to **Messaging > Try it out > Send a WhatsApp message** (or find the "WhatsApp Sandbox" settings).
3. Connect your personal WhatsApp number to the sandbox by sending the join code (e.g., "join purple-flower") to the Twilio number.
4. Go to the **Sandbox Settings** tab.
5. In the field labeled **"When a message comes in"**, paste your Ngrok URL followed by `/webhook`.
   - *Example:* `https://1a2b-3c-4d.ngrok-free.app/webhook`
6. Make sure the HTTP method is set to **POST**.
7. Click **Save**.

*Note: Every time you restart Ngrok, the URL changes. You must update both the `.env` file AND the Twilio Sandbox settings with the new URL.*

---

## 6. Start the AI Server

Go back to your first terminal window (where your virtual environment is active) and start the FastAPI server:

```bash
# Run the Python server
python whatsapp_handler.py
```

You should see logs indicating the server is running on port `8000`.

---

## 7. You're All Set!

You can now open WhatsApp on your phone and send a message (text or voice note) to the Twilio Sandbox number. 
- The bot will detect your language (English, Hindi, or Kannada).
- It will interact with Groq (for intelligence/image analysis) and Sarvam AI (for voice).
- The bot will seamlessly switch languages depending on the prompt you provide.

If voice notes aren't playing on Windows, make absolutely sure **FFmpeg** is installed and accessible from the command line by typing `ffmpeg -version` in your terminal!
