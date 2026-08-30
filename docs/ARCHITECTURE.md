# PL ValuEdge — System Architecture Specification

> **Production System Architecture & Data Delivery Pipeline**

---

## 1. High-Level Data Flow Topology

```text
                                  [ User / Browser Client ]
                                             │
                                             ▼
                          [ GitHub Pages CDN (React 18 PWA SPA) ]
                                             │
                                             ▼ (HTTPS REST API Calls)
                          [ Render Free Tier Web Service Container ]
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
[ Startup Acquisition Pipeline ]                            [ FastAPI Application Server ]
  (download_database.py)                                     (backend/app/main.py)
               │                                                           │
               ▼                                                           ▼
[ GitHub Release Release Asset ]                            [ SQLAlchemy ORM Query Layer ]
  (pl_valuation.db.gz ~105 MB)                                             │
               │                                                           ▼
               ▼                                            [ SQLite Database Storage ]
[ Decompressed SQLite File ] ─────────────────────────────►  (data/pl_valuation.db ~358 MB)
  (50,149 Players | 1.89M Appearances)                                     │
                                                                           ▼
                                                            [ XGBoost Inference Engine ]
                                                              (data/processed/ml/best_model.joblib)
```

---

## 2. Core Architectural Components

### A. Frontend Presentation Layer
- **Host**: GitHub Pages CDN (`https://ganeshancs.github.io/premier-league-valuation/`).
- **Framework**: React 18, TypeScript, Vite 6, Tailwind CSS, Framer Motion, Recharts.
- **PWA Caching**: Service Worker (`sw.js`) provides offline shell caching, with network-only bypass for live REST API endpoints.

### B. Backend API Application Layer
- **Host**: Render Free Tier Linux Container (`https://pl-valuedge-backend.onrender.com`).
- **Framework**: Python 3.11/3.14, FastAPI, Pydantic V2, Uvicorn ASGI Server.
- **CORS Handling**: Configured in `backend/app/core/config.py` using `Pydantic` `Union[str, List[str]]` parsing to allow production origins (`https://ganeshancs.github.io`) alongside local development servers (`localhost:3000`, `localhost:5173`).

### C. Storage & Database Acquisition Pipeline
- **Database Engine**: SQLite 3 (`data/pl_valuation.db`).
- **Storage Strategy**: Because the SQLite database is ~358 MB, storing binary database files in Git repositories is prohibited.
- **Acquisition at Container Startup**:
  1. Container boots and executes `python scripts/download_database.py`.
  2. `download_database.py` checks if `data/pl_valuation.db` exists and passes `PRAGMA integrity_check` plus table row count checks.
  3. If missing, it fetches `pl_valuation.db.gz` (~105 MB) from GitHub Release `v1.0.0-data`.
  4. Decompresses the archive to `data/pl_valuation.db`.
  5. Runs `PRAGMA integrity_check` and table verification.
  6. Upon verification, Uvicorn starts serving API requests.

### D. Machine Learning Inference & Artifact Loading
- **Valuation Model**: XGBoost Regressor (`data/processed/ml/best_model.joblib`). Loaded into memory on startup by `ValuationService`.
- **Explainability Artifacts**: `phase3_explainability_report.json` and `phase3_model_summary.json` loaded dynamically by `/api/model/analytics`.

---

## 3. Database Schema & Indexing

The production database `data/pl_valuation.db` enforces relational foreign keys and indices:

```sql
CREATE TABLE clubs (
    club_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    domestic_competition_id TEXT,
    squad_size INTEGER,
    created_at TIMESTAMP
);

CREATE TABLE players (
    player_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    current_club_id INTEGER REFERENCES clubs(club_id),
    position TEXT,
    sub_position TEXT,
    foot TEXT,
    height_in_cm INTEGER,
    market_value_in_eur REAL,
    created_at TIMESTAMP
);

CREATE TABLE player_market_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER REFERENCES players(player_id),
    valuation_date DATE NOT NULL,
    market_value_eur REAL NOT NULL,
    created_at TIMESTAMP
);
CREATE INDEX idx_pmv_player_date ON player_market_values(player_id, valuation_date);

CREATE TABLE transfers (
    transfer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER REFERENCES players(player_id),
    transfer_date DATE NOT NULL,
    from_club_id INTEGER REFERENCES clubs(club_id),
    to_club_id INTEGER REFERENCES clubs(club_id),
    transfer_fee_eur REAL,
    transfer_fee_status TEXT,
    created_at TIMESTAMP
);
CREATE INDEX idx_transfers_player_date ON transfers(player_id, transfer_date);

CREATE TABLE player_appearances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER REFERENCES players(player_id),
    game_date DATE NOT NULL,
    minutes_played INTEGER,
    goals INTEGER,
    assists INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,
    created_at TIMESTAMP
);
CREATE INDEX idx_appearances_player_date ON player_appearances(player_id, game_date);
```
