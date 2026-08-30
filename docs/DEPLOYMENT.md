# PL ValuEdge — Production Deployment Guide

> **Deployment Architecture, Environment Setup & Health Diagnostics**

---

## 1. Production Deployment Topology

- **Frontend Hosting**: GitHub Pages (`https://ganeshancs.github.io/premier-league-valuation/`)
- **Backend Hosting**: Render Free Tier Linux Container (`https://pl-valuedge-backend.onrender.com`)
- **Database Delivery**: GitHub Releases Asset (`pl_valuation.db.gz` v1.0.0-data)

---

## 2. Why Database Is Not Committed to Git

The production SQLite database (`pl_valuation.db`) is **~358 MB uncompressed** and **~105 MB compressed**.

Storing binary database files in Git repositories causes repository bloat, exceeds GitHub's 100 MB per-file push limit, and breaks version control performance.

**Production Solution**:
1. `data/pl_valuation.db` and `*.db.gz` are listed in `.gitignore`.
2. The compressed database `pl_valuation.db.gz` is hosted as a GitHub Release asset (`v1.0.0-data`).
3. On Render container startup, `scripts/download_database.py` downloads, decompresses, and validates the SQLite database before Uvicorn starts.

---

## 3. Render Container Startup Lifecycle

When Render deploys `pl-valuedge-backend`:

1. **Docker Build**: Render builds the container image using `Dockerfile`.
2. **Container Launch**: Docker executes the `CMD` instruction:
   ```bash
   python scripts/download_database.py && uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
   ```
3. **Database Download**: `scripts/download_database.py` downloads `pl_valuation.db.gz` from GitHub Releases if missing locally.
4. **Integrity Check**: SQLite runs `PRAGMA integrity_check` and verifies row counts (clubs: 1,852, players: 50,149, valuations: 656,301, transfers: 175,165, appearances: 1,894,348, predictions: 1,888).
5. **Uvicorn Start**: Uvicorn starts the FastAPI backend listening on `$PORT`.
6. **Health Check**: Render verifies `HEALTHCHECK --interval=30s CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1`.

---

## 4. Environment Variables

Configured in Render dashboard:

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Production environment flag |
| `CORS_ORIGINS` | `https://ganeshancs.github.io,http://localhost:3000,http://localhost:5173` | Allowed CORS origin URLs |
| `DATABASE_URL` | `sqlite:///data/pl_valuation.db` | SQLite database URI |
| `MODEL_VERSION` | `xgboost-v1` | ML model version identifier |
| `DATABASE_DOWNLOAD_URL` | `https://github.com/GANESHANCS/premier-league-valuation/releases/download/v1.0.0-data/pl_valuation.db.gz` | Production database release URL |

---

## 5. Deployment Commands & CI/CD Pipeline

- **Frontend Deployment**: Automated via GitHub Actions workflow (`.github/workflows/ci.yml`) on push to `main`, deploying `frontend/dist` to GitHub Pages.
- **Backend Deployment**: Render automatically triggers a Docker container build and deploy on push to `main`.
