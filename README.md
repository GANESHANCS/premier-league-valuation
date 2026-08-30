# PL ValuEdge — Premier League Valuation Intelligence

> **Production Machine Learning Valuation Terminal & Financial Analytics Engine**  
> *Independent Quantitative Football Analytics Platform*

[![Live Frontend](https://img.shields.io/badge/Live_Frontend-GitHub_Pages-06b6d4?style=for-the-badge&logo=github)](https://ganeshancs.github.io/premier-league-valuation/)
[![Live Backend](https://img.shields.io/badge/Live_Backend-Render-10b981?style=for-the-badge&logo=render)](https://pl-valuedge-backend.onrender.com/)
[![Model Version](https://img.shields.io/badge/Model-XGBoost--v1-06b6d4?style=for-the-badge)](#10-machine-learning-model)
[![Out-of-Time Test WAPE](https://img.shields.io/badge/Out--of--Time_WAPE-12.89%25-10b981?style=for-the-badge)](#12-model-metrics)
[![Out-of-Time Test R²](https://img.shields.io/badge/Out--of--Time_R²-0.9457-06b6d4?style=for-the-badge)](#12-model-metrics)

---

## 1. Overview

**PL ValuEdge** is a production-grade machine learning platform built to determine **Predicted Fair Value** for Premier League and global professional football players. By analyzing historical Transfermarkt valuation trajectories, trailing 365-day match performance statistics, transfer movements, and non-linear age curves under strict temporal anti-leakage constraints, PL ValuEdge isolates pricing inefficiencies and identifies **Model Undervalued** and **Model Overvalued** market opportunities.

---

## 2. Problem Statement

Association football transfer markets frequently suffer from informational noise, hype bias, short-term recency bias, and speculative valuation inflation. Traditional scouting reports lack quantitative baseline valuations, while historical market values reflect subjective crowd consensus. 

PL ValuEdge solves this problem by providing an objective, algorithmic **Fair Value Baseline** accompanied by an **80% Empirical Prediction Interval**, enabling recruitment analysts, sporting directors, and quantitative scouts to evaluate player pricing with institutional rigor.

---

## 3. Key Capabilities

- **Real-Time Fair Value Estimation**: Instant XGBoost inference generating predicted market values in Euros (€).
- **Signal Classification**: Automated classification of players into `UNDERVALUED`, `OVERVALUED`, or `FAIR VALUE` relative to observed market prices.
- **Empirical Uncertainty Quantification**: 80% empirical log-space residual prediction intervals $[p_{10}, p_{90}]$ providing upper and lower valuation bounds.
- **Permutation Feature Explainability**: Global feature importance ranking exposing key drivers of valuation (e.g., previous market value, prior valuation count, trailing 365-day appearances).
- **Player Scouting & Comparison Terminal**: Multi-attribute filtering, historical valuation timelines, side-by-side player comparisons (up to 6 players), and historical/future transfer tracking.
- **Broadcast Cyber Design Engine**: High-performance React PWA terminal featuring glassmorphism, responsive data visualizers, framer-motion micro-interactions, and live broadcast tickers.

---

## 4. Live Demo

- **Production Frontend**: [https://ganeshancs.github.io/premier-league-valuation/](https://ganeshancs.github.io/premier-league-valuation/)
- **Production Backend API**: [https://pl-valuedge-backend.onrender.com](https://pl-valuedge-backend.onrender.com)
- **API Health Check**: [https://pl-valuedge-backend.onrender.com/api/health](https://pl-valuedge-backend.onrender.com/api/health)
- **Model Analytics API**: [https://pl-valuedge-backend.onrender.com/api/model/analytics](https://pl-valuedge-backend.onrender.com/api/model/analytics)

---

## 5. System Architecture

```text
                                 [ User Browser / PWA Terminal ]
                                                │
                                                ▼
                             [ GitHub Pages CDN (React 18 SPA) ]
                                                │
                                                ▼ (HTTPS / CORS)
                             [ Render Free Tier Web Service Container ]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
  [ Database Startup Acquisition Pipeline ]                    [ FastAPI Application Server ]
                 │                                                             │
                 ▼                                                             ▼
  [ GitHub Releases Release Artifact ]                         [ SQLAlchemy ORM Query Engine ]
    (pl_valuation.db.gz ~105 MB)                                               │
                 │                                                             ▼
                 ▼                                            [ SQLite Database Engine ]
  [ Decompressed Production SQLite Database ] ────────────────►  (pl_valuation.db ~358 MB)
    (50,149 Players | 1.89M Appearances)                                       │
                                                                               ▼
                                                               [ XGBoost Valuation Model ]
                                                                 (best_model.joblib)
```

---

## 6. Technology Stack

- **Machine Learning & Pipeline**: Python 3.11/3.14, XGBoost 2.0+, Scikit-Learn 1.4+, Pandas, NumPy, Joblib.
- **Backend API**: FastAPI, Pydantic V2, SQLAlchemy, SQLite 3, Uvicorn, Gzip, TestClient.
- **Frontend SPA / PWA**: React 18, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Recharts, Lucide Icons, Service Workers.
- **Infrastructure & Deployment**: Render (Backend Docker Container), GitHub Pages (Frontend Hosting), GitHub Releases (Data Artifact Distribution).

---

## 7. Dataset

The authoritative production database (`pl_valuation.db`) contains complete historical records across European and global football:

| Entity | Record Count | Description |
| :--- | :--- | :--- |
| **Clubs** | `1,852` | Global football clubs across all major domestic leagues |
| **Players** | `50,149` | Professional football player master records |
| **Player Market Values** | `656,301` | Ground-truth historical Transfermarkt market value observations |
| **Transfers** | `175,165` | Disclosed, undisclosed, and free agent transfer records |
| **Player Appearances** | `1,894,348` | Match-level appearance statistics (minutes, goals, assists, cards) |
| **Player Predictions** | `1,888` | Active model inference predictions with gap percentages & intervals |

---

## 8. Data Pipeline

1. **Raw Data Ingestion**: Multi-table CSV ingestion normalizing clubs, players, valuations, appearances, and transfers.
2. **Schema Normalization & Indexing**: Foreign-key constraint enforcement, index creation on `player_id`, `club_id`, `valuation_date`, and `transfer_date`.
3. **Database Compression & Packaging**: Gzip compression producing `pl_valuation.db.gz` (~105 MB), published as GitHub Release asset `v1.0.0-data`.
4. **Startup Acquisition & Verification**: On Render container startup, `scripts/download_database.py` downloads, decompresses, and runs `PRAGMA integrity_check` plus table count verification before starting Uvicorn.

---

## 9. Feature Engineering

To compute predicted fair value at valuation date $t$, 32 temporal features are engineered strictly using historical observations:

- **Expanding Valuation History**: `prev_market_value_eur`, `days_since_prev_val`, `val_count_prior`, `hist_max_value_eur`, `hist_min_value_eur`, `val_change_365d`, `val_growth_ratio_365d`.
- **Trailing 365-Day Performance Window**: `apps_365d`, `starts_365d`, `minutes_365d`, `goals_365d`, `assists_365d`, `yellows_365d`, `reds_365d`, `goals_per90_365d`, `assists_per90_365d`, `contribs_per90_365d`.
- **Career Cumulative Totals**: `career_apps_prior`, `career_minutes_prior`, `career_goals_prior`, `career_assists_prior`.
- **Transfer Movement Features**: `prev_transfer_fee_eur`, `days_since_prev_transfer`, `total_prior_transfers`, `prev_transfer_fee_status`.
- **Demographics & Categoricals**: `age_at_valuation`, `age_squared`, `height_in_cm`, `main_position`, `sub_position`, `foot`, `height_imputed`.

---

## 10. Machine Learning Model

- **Algorithm**: Gradient Boosted Decision Trees (XGBoost Regressor).
- **Target Variable**: $\log(1 + \text{market\_value\_eur})$. Logarithmic transformation stabilizes target variance across multi-million Euro ranges.
- **Objective Function**: `reg:squarederror`.
- **Inference Pipeline**: Raw input features $\rightarrow$ Target Encoding & Standard Scaling $\rightarrow$ XGBoost Log Prediction $\rightarrow$ Exponential Back-Transformation $\exp(\hat{y}) - 1$.

---

## 11. Temporal / Out-of-Time Validation

To prevent temporal data leakage:
- **Random Splits Excluded**: Standard $k$-fold cross-validation suffers from temporal leakage when future player valuations leak into past training folds.
- **Out-of-Time Test Set**: The dataset is strictly split chronologically. Valuations prior to 2023 form the training/validation history, while valuations from **2023 to 2026** form the held-out temporal out-of-time test set.
- **Time-Series Cross-Validation**: 5-Fold `TimeSeriesSplit` cross-validation is evaluated across expanding historical temporal folds.

---

## 12. Model Metrics

Quantitative evaluation results compiled from `phase3_model_summary.json`:

| Metric | Out-of-Time Test Set (2023–2026) | 5-Fold TimeSeriesSplit CV |
| :--- | :--- | :--- |
| **Weighted Absolute Percentage Error (WAPE)** | **12.89%** | **15.20%** |
| **Coefficient of Determination ($R^2$)** | **0.9457** | **0.9577** |
| **Mean Absolute Error (MAE)** | **€2,255,249.92** | **€1,376,134.27** |
| **Median Absolute Error (MedAE)** | **€877,417.50** | **€310,112.75** |
| **Root Mean Squared Error (RMSE)** | **€4,950,696.25** | **€3,210,600.95** |
| **Log RMSE** | **0.3457** | **0.3983** |

---

## 13. Explainability

Permutation feature importance measures the fractional increase in log prediction error when feature values are randomly permuted across test records:

1. **`prev_market_value_eur`**: `136.79%` relative log sensitivity (primary anchor metric).
2. **`val_count_prior`**: `7.42%` sensitivity (valuation history depth).
3. **`prev_transfer_fee_eur`**: `3.19%` sensitivity (latest fee baseline).
4. **`total_prior_transfers`**: `0.61%` sensitivity (market liquidity).
5. **`apps_365d`**: `0.43%` sensitivity (recent workload/match readiness).
6. **`age_at_valuation`**: `0.40%` sensitivity (developmental phase).
7. **`minutes_365d`**: `0.39%` sensitivity (playing time density).
8. **`val_change_365d`**: `0.38%` sensitivity (valuation momentum).
9. **`days_since_prev_val`**: `0.26%` sensitivity (recency decay).
10. **`days_since_prev_transfer`**: `0.18%` sensitivity (contract recency).

---

## 14. Backend API

FastAPI endpoints provided by `backend/app/api/`:

| Method | Endpoint | Purpose | Key Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend system health & model status | None |
| `GET` | `/api/dashboard/summary` | Top undervalued/overvalued & summary stats | None |
| `GET` | `/api/players` | Filterable player matrix | `league`, `search`, `signal`, `page`, `page_size` |
| `GET` | `/api/players/{id}` | Player detail profile & valuation history | `id` (int) |
| `GET` | `/api/players/{id}/valuation` | Model prediction & 80% interval bounds | `id` (int) |
| `GET` | `/api/players/compare` | Multi-player comparison vector | `player_ids` (comma-separated IDs) |
| `GET` | `/api/transfers` | Global transfer movement feed | `scope` (`historical`/`future`), `page`, `page_size` |
| `GET` | `/api/model/analytics` | Model metrics, importances & error calibration | None |

---

## 15. Frontend

- **Single Page Application (SPA)**: Built with React 18 & TypeScript, bundled using Vite 6.
- **PWA Features**: Service Worker (`public/sw.js`) and Manifest (`public/manifest.webmanifest`) enabling offline app shell caching.
- **Pages**: Dashboard (`/`), Player Discovery (`/players`), Player Profile (`/players/:id`), Comparison (`/compare`), Transfers (`/transfers`), Model Analytics (`/model-analytics`).
- **Visual Design**: Broadcast-grade cyber aesthetic featuring dark ambient glassmorphism (`#080c12`), signal emerald (`#10b981`) & signal cyan (`#06b6d4`) telemetry indicators, SVG Recharts visualizers, and Framer Motion transitions.

---

## 16. Production Deployment

- **Frontend Host**: GitHub Pages (Static HTML/JS SPA built via Vite).
- **Backend Host**: Render (Free Tier Linux Container Web Service).
- **CORS Configuration**: Configured in `backend/app/core/config.py` supporting comma-separated `CORS_ORIGINS` (`https://ganeshancs.github.io,http://localhost:3000,http://localhost:5173`).
- **Container Environment**: Python 3.11-slim Docker image with HEALTHCHECK on `/api/health`.

---

## 17. Database Delivery Strategy

Because the SQLite database is ~358 MB uncompressed (~105 MB gzipped), storing binary database files in Git repositories is bad practice and hits GitHub file limits.

**Production Solution**:
1. Compressed database `pl_valuation.db.gz` is published to GitHub Release `v1.0.0-data`.
2. On Render container startup, `scripts/download_database.py` downloads `pl_valuation.db.gz`, decompresses it to `/app/data/pl_valuation.db`, and executes SQLite integrity verification before Uvicorn starts.

---

## 18. Local Development

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
```powershell
# Install backend dependencies
pip install -r requirements.txt

# Run backend API test suite (10/10 PASS)
python -m pytest backend/tests/test_api.py -v

# Start FastAPI server on localhost:8000
uvicorn backend.app.main:app --reload --port 8000
```

### 3. Frontend Setup
```powershell
cd frontend

# Install Node dependencies
npm install

# Run Vite dev server on localhost:3000
npm run dev

# Build production bundle
npm run build
```

---

## 19. Environment Variables

Supported environment variables (`backend/app/core/config.py`):

| Variable | Default Value | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Environment mode (`development`/`production`) |
| `CORS_ORIGINS` | `https://ganeshancs.github.io,http://localhost:3000,http://localhost:5173` | Allowed CORS origins (comma-separated string or list) |
| `DATABASE_URL` | `sqlite:///data/pl_valuation.db` | SQLAlchemy database connection URI |
| `MODEL_VERSION` | `xgboost-v1` | Machine learning model version string |
| `DATABASE_DOWNLOAD_URL` | `https://github.com/GANESHANCS/premier-league-valuation/releases/download/v1.0.0-data/pl_valuation.db.gz` | GitHub Release URL for database acquisition |

---

## 20. Project Structure

```text
PremierLeague-Valuation/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (dashboard, players, transfers, model)
│   │   ├── core/            # Configuration & settings (Pydantic V2)
│   │   ├── db/              # Database session & engine setup
│   │   ├── models/          # SQLAlchemy entity models (indexed schema)
│   │   ├── schemas/         # Pydantic schema contracts
│   │   └── services/        # Valuation engine & business logic
│   └── tests/               # Pytest suite (10/10 PASS)
├── data/
│   └── processed/
│       └── ml/              # Model binary & JSON report artifacts (joblib, jsons)
├── docs/                    # Architecture, ML methodology & deployment guides
├── frontend/
│   ├── public/              # PWA manifest, service worker & static icons
│   ├── src/
│   │   ├── api/             # Frontend HTTP client & fetch wrappers
│   │   ├── components/      # UI components & visual engines
│   │   ├── pages/           # 6 main view components
│   │   └── types/           # TypeScript API interfaces
│   ├── index.html
│   └── vite.config.ts       # Vite & Rollup build config
├── scripts/                 # Database load & startup acquisition scripts
├── Dockerfile               # Production Render container definition
├── render.yaml              # Render blueprint specification
├── requirements.txt         # Backend Python dependencies
├── .gitignore               # Git exclude rules
└── README.md                # Project documentation
```

---

## 21. Limitations

- **Free Tier Latency**: Render free tier instances spin down after inactivity, causing a cold-start delay (~50s) on initial request while the container starts up and acquires the database.
- **Contract End Dates**: Contract duration data is partially complete for historical records prior to 2018.
- **Off-Pitch Metrics**: Social media sentiment and commercial sponsorship metrics are excluded from the model feature space.

---

## 22. Future Improvements

- **PostgreSQL Migration**: Optional migration to managed cloud PostgreSQL for instant container startups without local SQLite downloads.
- **Real-Time Match Feed**: Live match event streaming to update performance features weekly during active domestic seasons.
- **Positional Heatmaps**: Spatial coordinate integration for tactical role profiling.

---

## 23. Disclaimer / Data Provenance

> **LEGAL NOTICE**  
> Premier League Valuation Intelligence (PL ValuEdge) is an independent quantitative portfolio analytics project created strictly for educational, research, and non-commercial analytical demonstration purposes.  
> It is **NOT** affiliated with, endorsed by, or sponsored by Transfermarkt, the Premier League, FIFA, UEFA, or any professional football club. All trademarked names and logos remain the property of their respective trademark holders.
