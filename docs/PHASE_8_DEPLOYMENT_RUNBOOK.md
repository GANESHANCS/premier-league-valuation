# Phase 8 Operational Deployment Runbook

**Project:** Premier League Valuation Intelligence (PL ValuEdge)  
**Target Architecture:** Render Unified Blueprint (Web Service + Managed PostgreSQL + Static Site)  

---

## 1. Prerequisites

Before starting deployment, ensure you have:
1. A **Render account** (or equivalent cloud host like Railway/AWS).
2. GitHub access to the repository: `https://github.com/GANESHANCS/premier-league-valuation.git`.
3. The trained ML model artifact `data/processed/ml/best_model.joblib` (generated locally via `python -m backend.scripts.train_model` or available in local workspace).

---

## 2. Step-by-Step Production Deployment Procedure

### Step 1: Connect Repository to Render Blueprint
1. Log into your **Render Dashboard** (`https://dashboard.render.com`).
2. Click **New +** and select **Blueprint**.
3. Connect your GitHub account and select repository `GANESHANCS/premier-league-valuation`.
4. Render will automatically detect `render.yaml` and parse:
   - Database service: `pl-valuedge-db` (PostgreSQL)
   - Backend web service: `pl-valuedge-backend` (Python Uvicorn)
   - Frontend static site: `pl-valuedge-frontend` (React PWA)

### Step 2: Provision Managed PostgreSQL Database
1. Under `pl-valuedge-db`, select your desired region (e.g. `Oregon (US West)` or `Frankfurt (EU Central)`).
2. Click **Apply Blueprint**.
3. Wait for `pl-valuedge-db` provisioning to finish and copy the internal `DATABASE_URL` connection string:
   `postgresql://valuedge_user:password@pl-valuedge-db:5432/valuedge_db`

### Step 3: Configure Production Environment Variables
In the `pl-valuedge-backend` service settings, ensure the following environment variables are set:

| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Enables strict CORS and security settings |
| `PROJECT_NAME` | `Premier League Valuation Intelligence` | OpenAPI service title |
| `VERSION` | `1.0.0` | API SemVer identifier |
| `API_PREFIX` | `/api` | Root endpoint prefix |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `MODEL_PATH` | `data/processed/ml/best_model.joblib` | Relative path to ML model pipeline |
| `MODEL_VERSION` | `xgboost-v1` | ML model version flag |
| `CORS_ORIGINS` | `https://pl-valuedge-frontend.onrender.com` | Production CORS allowed origins |

### Step 4: Upload / Retrieve Model Artifact
Ensure `data/processed/ml/best_model.joblib` (~869 KB) is accessible to the backend build container:
- **Option A (Automated Build)**: Render build command automatically executes `python scripts/load_database.py` which loads the pipeline from disk if included in persistent storage or release asset.
- **Option B (GitHub Release)**: Download `best_model.joblib` from GitHub Releases during build:
  `curl -L https://github.com/GANESHANCS/premier-league-valuation/releases/download/v1.0.0/best_model.joblib -o data/processed/ml/best_model.joblib`

### Step 5: Execute Idempotent Database Seeding
Execute the database initialization script against PostgreSQL:
```bash
python scripts/load_database.py
```
*Expected Console Output:*
```text
==========================================================================
      PL VALUEDGE - REPRODUCIBLE DATABASE SEEDING PIPELINE                
==========================================================================
[*] Creating Database Schema Tables...
[*] Truncating existing database tables...
[*] Seeding Clubs & Players from processed datasets...
  [+] Seeded 1,852 Clubs & 50,149 Players.
[*] Seeding Market Values...
  [+] Seeded 656,301 Market Valuation records.
[*] Seeding Transfer History...
  [+] Seeded 175,165 Transfer records.
[*] Seeding Match Appearances...
  [+] Seeded 1,894,348 Appearance records.
[*] Precomputing ML Valuation Predictions for Database...
  [+] Precomputed and Seeded 1,888 Player Predictions.
==========================================================================
      [OK] DATABASE SEEDING COMPLETED SUCCESSFULLY                        
==========================================================================
```

### Step 6: Deploy Backend Service & Check Health
1. Trigger **Deploy Latest Commit** on `pl-valuedge-backend`.
2. Once deployed, test the public health endpoint:
   `GET https://pl-valuedge-backend.onrender.com/api/health`
3. Verify JSON payload:
```json
{
  "status": "healthy",
  "service": "Premier League Valuation Intelligence",
  "version": "1.0.0",
  "database": "healthy",
  "model_version": "xgboost-v1",
  "model": {
    "status": "loaded",
    "version": "xgboost-v1"
  }
}
```

### Step 7: Configure Frontend Static Site
1. In `pl-valuedge-frontend` settings, set environment variable:
   `VITE_API_BASE_URL=https://pl-valuedge-backend.onrender.com/api`
2. Trigger build command: `cd frontend && npm install && npm run build`.
3. Set publish directory: `./frontend/dist`.
4. Configure SPA rewrite rule:
   - Source: `/*`
   - Destination: `/index.html`

### Step 8: Production Validation Smoke Test
Navigate to the public frontend URL (`https://pl-valuedge-frontend.onrender.com`) and test:
- [x] **Dashboard (`/`)**: Verify aggregate valuation stats, top undervalued/overvalued cards load.
- [x] **Discovery (`/discovery`)**: Test player search (`Haaland`), position filtering, and pagination.
- [x] **Profile (`/player/:id`)**: Verify historical valuation chart (Recharts) and 80% prediction interval.
- [x] **Compare (`/compare`)**: Test adding 2+ players into comparison matrix.
- [x] **Transfers (`/transfers`)**: Check global transfer feed pagination.
- [x] **Model Analytics (`/analytics`)**: Verify model evaluation scores ($R^2=0.9542$, $\text{WAPE}=14.86\%$).
- [x] **PWA Verification**: Confirm Service Worker registers (`sw.js`) and PWA install prompt functions.

---

## 3. Rollback & Disaster Recovery Procedures

1. **Service Rollback**: In Render Dashboard -> `pl-valuedge-backend` -> **Deploys** -> Select previous stable deployment -> Click **Rollback**.
2. **Database Re-Seeding**: If database schema is corrupted, re-run `python scripts/load_database.py` against `DATABASE_URL`. The script truncates and bulk-seeds all records cleanly from raw CSV sources.
