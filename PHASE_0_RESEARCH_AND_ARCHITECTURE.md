# Premier League Valuation Intelligence (PL ValuEdge)
## Phase 0 — Project Research & Architecture Report

---

### Executive Summary & Architectural Vision

**Premier League Valuation Intelligence (PL ValuEdge)** is designed as an enterprise-grade, portfolio-level installable Progressive Web Application (PWA) backed by an end-to-end data pipeline, machine learning valuation system, asynchronous REST API, and PostgreSQL relational database. 

Unlike standard dashboards or static analytics tools, PL ValuEdge delivers market value tracking, ML-driven fair valuation predictions, historical transfer fee comparisons, and an interactive transfer simulator anchored strictly in a **third-party Transfermarkt-derived dataset (`dcaribou/transfermarkt-datasets`)**.

*Disclaimer: PL ValuEdge is a portfolio analytics project and is not affiliated with, sponsored by, or endorsed by Transfermarkt.*

This Phase 0 report establishes the complete data audit, entity resolution methodology, PostgreSQL relational data model, anti-leakage machine learning methodology, system architecture, visual design language, and phase-by-phase development roadmap.

---

### 1. Recommended Dataset(s) & Audit

#### Candidate Comparison
* **Primary Core Dataset**: Third-party Transfermarkt-derived dataset (`dcaribou/transfermarkt-datasets` hosted on Cloudflare R2 / Kaggle, CC0 1.0 Public Domain License). Provides crowdsourced market values, historical valuation timelines (2000–2026), transfer fees, games, lineups, and player details. Premier League league code: `GB1`.
* **Secondary Feature Enricher**: `FBref` (ingested via Python `soccerdata` / open extracts). Enriches Premier League player season profiles with advanced per-90 tactical metrics (Expected Goals `xG`, Expected Assists `xA`, progressive actions).
* **Excluded Sources**: `StatsBomb Open Data` (coverage limited to select historical seasons) and `Football-Data.co.uk` (lacks individual player valuations/performance statistics).

---

### 2. Four-Tier Valuation & Financial Taxonomy

PL ValuEdge strictly segregates four distinct monetary and valuation concepts:
1. **Observed Market Value**: Latest time-stamped market value observation recorded in our third-party dataset on a specific date (e.g., £75.0M on 2026-06-12). Used as ground truth target for ML modeling.
2. **Historical Market Value**: Time-series array of prior observed values for a player showing historical valuation trajectories over time.
3. **Actual Transfer Fee**: Realized transaction fee agreed by buying and selling clubs in historical transfers (e.g., £100.0M). Semantically distinguishes between explicit free transfers (€0) and undisclosed/unknown fees (NULL).
4. **ML Predicted Fair Value**: Model-computed intrinsic value based on trailing performance, age, position, and club strength (e.g., £82.4M). Used as investment signal.

> **NO MOCK DATA RULE**: Observed market values and transfer fees will NEVER be hardcoded, mocked, or typed manually. All valuations will be derived directly from verified raw dataset records.

---

### 3. Data Integration & Entity Resolution Strategy

* **Primary Entity Keys**: Transfermarkt `player_id` and `club_id` as canonical primary keys.
* **Deterministic Pre-Matching**: Leverage the open-source `Reep` football entity register and `worldfootballR` crosswalk dictionary for 1:1 mapping of ~90% of Premier League players across Transfermarkt and FBref.
* **Fuzzy Contextual Matching**: For remaining unlinked players, compute a composite similarity score:
  $$\text{Score} = 0.5 \cdot \text{JaroWinkler}(\text{Name}_A, \text{Name}_B) + 0.3 \cdot \mathbb{I}(\text{DOB}_A = \text{DOB}_B) + 0.2 \cdot \mathbb{I}(\text{Club}_A = \text{Club}_B)$$
* **Resolution Audit Table**: Log unmatched records with similarity $< 0.88$ to a dedicated `unresolved_entities` PostgreSQL table for auditability.

---

### 4. Proposed PostgreSQL Database Schema

Entities designed in 3NF:
* `competitions` (competition_id, name, country_name, sub_type)
* `clubs` (club_id, name, competition_id, squad_size, stadium_name, stadium_seats)
* `players` (player_id, name, first_name, last_name, date_of_birth, country_of_citizenship, sub_position, main_position, foot, height_in_cm, current_club_id, contract_expiration_date, height_imputed, foot_imputed, sub_position_imputed, market_value_missing)
* `player_valuations` (valuation_id, player_id, valuation_date, market_value_in_eur, current_club_id)
* `transfers` (transfer_id, player_id, transfer_date, season, from_club_id, to_club_id, transfer_fee_in_eur, market_value_in_eur, transfer_fee_status)
* `appearances` (appearance_id, game_id, player_id, player_club_id, game_date, minutes_played, goals, assists, yellow_cards, red_cards, position)
* `player_season_stats` (stat_id, player_id, season_year, club_id, appearances, starts, minutes_played, goals, assists, goals_per90, assists_per90, xg_per90, xa_per90)
* `model_runs` (run_id, model_name, model_version, hyperparameters, train_cutoff_date, mae_eur, rmse_eur, r2_score, created_at)
* `model_predictions` (prediction_id, run_id, player_id, valuation_date, observed_market_value_eur, predicted_market_value_eur, valuation_gap_eur, valuation_ratio, feature_shap_values, created_at)
* `watchlists` (watchlist_id, user_id, player_id, added_at, target_buy_below_eur)
* `alerts` (alert_id, user_id, player_id, alert_type, old_value_eur, new_value_eur, is_read, created_at)

---

### 5. Machine Learning Methodology & Strict Anti-Leakage Design

* **Target Variable**: $Y = \ln(\text{market\_value\_in\_eur} + 1)$ to handle heavy right-skewed distribution. (Missing market values are excluded from target training set).
* **Strict Anti-Leakage Rule**: For any valuation point at date $T_{\text{val}}$, features MUST ONLY be computed from matches, transfers, and stats occurring strictly BEFORE $T_{\text{val}}$.
* **Time-Series Split**:
  * **Train**: July 2015 – June 2022
  * **Validation**: July 2022 – June 2023
  * **Out-of-Time Test**: July 2023 – Present
* **Candidate Models**: Baseline Ridge/Lasso, Random Forest Regressor, XGBoost/LightGBM (with Optuna hyperparameter optimization).
* **Metrics**: MAE (€), RMSLE, $R^2$, and Valuation Gap Precision@K.

---

### 6. System Architecture Overview

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, PWA Service Worker (`vite-plugin-pwa`), Web App Manifest.
* **Backend**: Python 3.11+, FastAPI REST API, Pydantic v2, SQLAlchemy 2.0 / AsyncPG, Alembic migrations.
* **Data & ML**: DuckDB for local ingestion, Pandas/NumPy, Scikit-Learn, XGBoost, Joblib ML model registry.
* **Database**: PostgreSQL 16.

---

### 7. Cinematic Visual, Motion & Interaction Architecture

* **Aesthetic Language**: Cinematic sports documentary meets futuristic scouting/data command terminal. Dark slate base (`#0b0f19`), translucent glassmorphic surfaces (`bg-slate-900/60 backdrop-blur-md border border-slate-800`), restrained neon accents (Emerald for undervalued, Crimson for overvalued, Electric Cyan for ML predictions), and editorial display typography.
* **Legally Sourced Contextual Background Video**:
  * Public domain & royalty-free stock footage (Pexels / Mixkit stock assets / self-hosted open video clips). Absolutely zero copyrighted broadcast media.
  * Section mapping: Stadium atmosphere (Dashboard), Training/Pitch (Players), Tactical passing (Compare), Stadium tunnel (Transfers), Data nodes (Model Analytics).
  * Video rules: Muted, looping, `object-fit: cover`, dark gradient overlay, lazy-loaded with static poster fallbacks.
* **Cinematic Route & Typography Motion**:
  * Framer Motion page reveals (opacity fade + subtle 0.98 -> 1.0 scale + blur fade).
  * Sequenced hero text entrance (`PLAYER` ➔ `VALUATION` ➔ `INTELLIGENCE`).
  * Progressive SVG path drawing for valuation charts & animated numeric counters.
  * 1.4s application initialization splash sequence with instant skip for returning sessions.
* **Accessibility & Reduced Motion**:
  * Strict `prefers-reduced-motion` compliance. Parallax disabled, videos replaced with static posters, transform offsets zeroed out.
  * Target 60 FPS performance via GPU-accelerated CSS properties (`transform`, `opacity`).

---

### 8. 11-Phase Master Roadmap

* **Phase 0 — Project Research & Architecture (COMPLETED)**
* **Phase 1 — Data Ingestion & Dataset Audit Pipeline (COMPLETED)**
* **Phase 2 — Feature Engineering & Entity Resolution**
* **Phase 3 — Machine Learning Model Development**
* **Phase 4 — PostgreSQL Database & Migration Layer**
* **Phase 5 — FastAPI Backend Application**
* **Phase 6 — PWA Frontend Foundation**
* **Phase 7 — Interactive Application Features**
* **Phase 8 — End-to-End System Integration**
* **Phase 9 — Production Audit & Performance Optimization**
* **Phase 10 — Deployment & Documentation**

---

### STOP CONDITION

**Phase 0 & Phase 1 are complete.** No application code, fake data, or premature database instances have been created. Phase 2 implementation will begin upon user approval.
