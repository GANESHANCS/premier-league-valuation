# PL ValuEdge - Production FastAPI Backend & ML Engine Dockerfile
FROM python:3.11-slim

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code & scripts
COPY backend ./backend
COPY data/processed/ml ./data/processed/ml
COPY scripts ./scripts

# Expose port
EXPOSE 8000

# Container Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

# Start Uvicorn Server with Database Acquisition Pipeline
CMD ["sh", "-c", "python scripts/download_database.py && uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
