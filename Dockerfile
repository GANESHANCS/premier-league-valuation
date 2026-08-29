# PL ValuEdge - Production FastAPI Backend & ML Engine Dockerfile
FROM python:3.11-slim

# Prevent Python from writing bytecode and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

WORKDIR /app

# Install system dependencies for build & PostgreSQL connectivity
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend ./backend
COPY data/processed ./data/processed
COPY scripts ./scripts

# Expose port
EXPOSE 8000

# Container Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Start Uvicorn Server
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
