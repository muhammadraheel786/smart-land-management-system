# Production Dockerfile for Django backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Use PORT from environment (Fly.io=8080, Railway/Render set their own)
ENV PORT=8080
EXPOSE 8080

# Health check (Fly.io also uses /api/health via http_service.checks)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/api/health')"

# Run with gunicorn (2 workers for free tier 256MB)
CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --workers 2 --threads 2 --timeout 120

