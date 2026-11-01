FROM python:3.11-slim

# Install system dependencies including ffmpeg for audio transcoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY whatsapp_handler.py ai_services.py .

# Ensure audio directory exists
RUN mkdir -p /tmp/pf_audio

# Expose port (Render automatically provides $PORT)
ENV PORT=8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Run FastAPI with uvicorn
CMD ["sh", "-c", "uvicorn whatsapp_handler:app --host 0.0.0.0 --port ${PORT:-8000}"]
