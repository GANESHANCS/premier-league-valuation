# PL ValuEdge — Premier League Valuation Intelligence

> **Temporal Machine Learning Market Valuation System**  
> *Independent Portfolio Analytics Platform for Football Market Intelligence*

[![Phase 7 Deployment Ready](https://img.shields.io/badge/Phase_7-Deployment_Ready-10b981?style=for-the-badge)](docs/PHASE_7_DEPLOYMENT_READINESS_REPORT.md)
[![Model Version](https://img.shields.io/badge/Model-XGBoost--v1-06b6d4?style=for-the-badge)](data/processed/ml/best_model.joblib)
[![Out--of--Time R²](https://img.shields.io/badge/Out--of--Time_R²-0.9542-10b981?style=for-the-badge)](#machine-learning--evaluation)
[![Out--of--Time WAPE](https://img.shields.io/badge/Out--of--Time_WAPE-14.86%25-06b6d4?style=for-the-badge)](#machine-learning--evaluation)
[![CI Pipeline](https://img.shields.io/badge/CI-Passing-10b981?style=for-the-badge)](.github/workflows/ci.yml)

---

## Legal & Data Provenance Disclaimer

> **IMPORTANT DISCLAIMER**  
> Premier League Valuation Intelligence (PL ValuEdge) is an independent portfolio analytics project and is **NOT** affiliated with, sponsored by, or endorsed by Transfermarkt, the Premier League, or any football club or governing body.  
> Historical market values and transfer data are processed from public statistical datasets strictly for non-commercial educational and analytical demonstration purposes under open data licensing guidelines.

---

## Overview

**PL ValuEdge** is a production-grade machine learning platform designed to calculate **Predicted Fair Value** for Premier League and global football players. By combining historical transfer records, trailing 365-day performance metrics, and age trajectories, the system identifies market mispricings and surfaces **Model Undervalued** and **Model Overvalued** opportunities.

### Key Conceptual Separation
- **Observed Market Value**: Ground-truth historical market valuation recorded in Transfermarkt datasets.
- **Predicted Fair Value**: XGBoost inference estimate derived strictly from features computed *prior to or on* the valuation snapshot date.

---

## Machine Learning & Anti-Leakage Architecture

```text
Raw Historical Datasets
         │
         ▼
[Phase 1] Ingestion, Validation & Schema Normalization
         │
         ▼
[Phase 2] Temporal Feature Engineering (Strict Anti-Leakage)
         │  • Trailing 365d Performance Window
         │  • Expanding Historical Valuation Features
         │  • Age Trajectories & Contractual Status
         ▼
[Phase 3] XGBoost Valuation Engine (Log-Space Regression)
         │  • Held-Out Out-of-Time Test Set (2023–2026)
         │  • 80% Empirical Residual Quantile Prediction Intervals
         ▼
[Phase 4] FastAPI Backend + SQLite/PostgreSQL Database
         │
         ▼
[Phase 5-6] Cinematic React/TypeScript PWA Terminal
```

### Strict Anti-Leakage Temporal Feature Engineering
To prevent temporal data leakage:
1. Features for any valuation date $t$ use **only match statistics and transfers occurring on or before $t$**.
2. Evaluation relies on a strict **held-out out-of-time test set (2023–2026)** rather than random train/test splits.

### Machine Learning Evaluation Scores

| Metric | Out-of-Time Test Set (2023–2026) | 5-Fold TimeSeriesSplit CV |
| :--- | :--- | :--- |
| **$R^2$ Variance Score** | **0.9542** | **0.9410** |
| **WAPE (Weighted Abs % Error)** | **14.86%** | **15.22%** |
| **MAE (Mean Absolute Error)** | **€1.69M** | **€1.78M** |
| **Median Absolute Error** | **€0.68M** | **€0.72M** |
| **Prediction Uncertainty** | **80% Quantile Interval** $[p_{10}, p_{90}]$ | Empirical Log Residuals |

---

## Application Features

1. **Valuation Command Dashboard**: Top Model Undervalued & Overvalued lists, aggregate league stats, system freshness monitors.
2. **Player Discovery Matrix**: Multi-filter player search with pagination, position filtering, and valuation signal filtering (`UNDERVALUED`, `OVERVALUED`, `FAIR VALUE`).
3. **Player Valuation Profile**: Detailed player bio, historical valuation timeline (Recharts), trailing 365-day stats, 80% prediction interval bounds, and key model factors.
4. **Comparison Matrix**: Side-by-side comparison of up to 6 players across valuation metrics, age, position, and performance.
5. **Global Transfer Intelligence**: Filterable feed of disclosed, undisclosed, and free historical transfer records.
6. **Model Analytics Terminal**: Model evaluation scores, permutation feature importances, and residual quantile methodology.
7. **PWA Standalone App**: Service worker offline shell caching with network-only bypass for live API data.

---

## Technical Stack

- **Backend**: Python 3.14, FastAPI, Pydantic V2 (`ConfigDict`), SQLAlchemy, SQLite / PostgreSQL.
- **Machine Learning**: XGBoost, Scikit-Learn, Pandas, NumPy, Joblib.
- **Frontend**: React 18, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Recharts, Lucide React.
- **PWA**: Service Worker (`sw.js`), Web App Manifest (`manifest.webmanifest`).

---

## Quickstart & Local Development

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Environment Configuration
Copy the environment template:
```powershell
cp .env.example .env
```

### 3. Backend Setup
Install dependencies and run tests:
```powershell
# Install backend requirements (if virtual environment is active)
pip install -r requirements.txt

# Run backend API tests
python -m pytest backend/tests/test_api.py -v

# Start FastAPI dev server (port 8000)
uvicorn backend.app.main:app --reload --port 8000
```

### 4. Frontend Setup
```powershell
cd frontend

# Install dependencies
npm install

# Run Vite dev server (port 3000)
npm run dev

### 5. Production Docker Containerization
Run full application stack (FastAPI backend + PostgreSQL 16 database):
```powershell
# Build and run container stack in background
docker-compose up -d --build

# Check health diagnostics
curl http://localhost:8000/api/health
```

---

## Project Structure

```text
PremierLeague-Valuation/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (players, dashboard, transfers, model)
│   │   ├── core/            # Configuration & settings (Pydantic V2)
│   │   ├── db/              # Database session & engine setup
│   │   ├── models/          # SQLAlchemy entity models (indexed schemas)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── services/        # Valuation engine & business logic
│   └── tests/               # Pytest test suite (100% pass)
├── data/                    # Database & processed dataset artifacts (gitignored)
├── docs/                    # Architectural & Phase 1-6 documentation reports
├── frontend/
│   ├── public/              # PWA manifest, service worker, & icons
│   ├── src/
│   │   ├── api/             # API client & fetch wrappers
│   │   ├── components/      # UI components & visual engines
│   │   ├── pages/           # 6 main application views
│   │   └── types/           # TypeScript API interfaces
│   ├── index.html
│   └── vite.config.ts       # Optimized Rollup manualChunks configuration
├── .env.example
├── .gitignore
└── README.md
```

---

## Verification & Build Status

- **Backend Pytest**: `10 passed in 3.01s` (100% pass rate)
- **Frontend Build**: Built cleanly in `4.55s` with 0 errors
- **Git Hygiene**: Clean working tree with zero untracked binary/database files

---

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
