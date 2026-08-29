# PHASE 4 — DATABASE & BACKEND ARCHITECTURE REPORT
**Application**: Premier League Valuation Intelligence (PL ValuEdge)  
**Phase**: Phase 4 — Database & Backend Architecture  
**Execution Date**: August 2026  
**Status**: Completed, Tested & Verified (7/7 Pytest Suite Pass)  

---

## Executive Summary

Phase 4 constructed a high-performance, production-oriented backend architecture powered by **Python, FastAPI, SQLAlchemy, PostgreSQL (with SQLite zero-config local fallback), Pydantic v2**, and **Alembic**.

The backend loads the trained XGBoost model (`best_model.joblib`) as a singleton service at startup and serves real, un-mocked data from the audited Phase 1–3 data pipelines.

---

## 1. Database Architecture & Schema Design

The relational database schema enforces strict entity normalization with explicit field separation for financial and model attributes:

### Primary Database Entities
1. **`clubs`**: `club_id`, `name`, `normalized_name`, `domestic_competition_id`
2. **`players`**: `player_id`, `name`, `date_of_birth`, `position`, `sub_position`, `foot`, `height_in_cm`, `height_imputed`, `country_of_citizenship`, `current_club_id`
3. **`player_market_values`**: `id`, `player_id`, `valuation_date`, `market_value_eur`, `source`, `data_retrieved_at`
4. **`transfers`**: `id`, `player_id`, `transfer_date`, `from_club_name`, `to_club_name`, `transfer_fee_eur`, `transfer_fee_status` (`disclosed`, `free_transfer`, `undisclosed`)
5. **`player_appearances`**: `id`, `player_id`, `game_id`, `date`, `competition_id`, `goals`, `assists`, `minutes_played`, `yellow_cards`, `red_cards`
6. **`player_predictions`**: `id`, `player_id`, `prediction_date`, `model_version`, `predicted_fair_value_eur`, `lower_bound_eur`, `upper_bound_eur`, `observed_market_value_eur`, `valuation_gap_eur`, `valuation_gap_pct`

---

## 2. Field Distinction Governance

The schema strictly maintains conceptual separation between:
* **`observed_market_value_eur`**: Ground truth recorded market value from third-party Transfermarkt-derived dataset.
* **`transfer_fee_eur`**: Historical transaction fee.
* **`predicted_fair_value_eur`**: XGBoost model output ($\hat{y}_{\text{eur}}$).
* **`valuation_gap_eur`**: $\text{predicted\_fair\_value\_eur} - \text{observed\_market\_value\_eur}$.
* **`valuation_gap_pct`**: Relative percentage gap ($(\text{gap} / \text{observed}) \times 100$).

---

## 3. Data Seeding Statistics (`scripts/load_database.py`)

* **Clubs Seeded**: **1,852 clubs**
* **Players Seeded**: **50,149 players**
* **Market Valuation Records**: **656,301 records**
* **Transfer Records**: **175,165 records**
* **Match Appearance Records**: **1,894,348 records**
* **Precomputed Predictions**: **1,888 Premier League player predictions**

---

## 4. REST API Endpoint Specification

| Method | Endpoint | Description | Query Parameters | Response Schema |
| :--- | :--- | :--- | :--- | :--- |
| **`GET`** | `/api/health` | Backend & model health check | N/A | Status, DB status, Model Version |
| **`GET`** | `/api/players` | List & search players | `search`, `position`, `club_id`, `page`, `page_size` | `PaginatedPlayersResponse` |
| **`GET`** | `/api/players/{player_id}` | Full player profile detail | `player_id` | `PlayerDetailResponse` |
| **`GET`** | `/api/players/{player_id}/valuation` | Fair value prediction & intervals | `player_id` | `PredictionResponse` |
| **`GET`** | `/api/players/{player_id}/valuations` | Valuation history timeline | `player_id` | `List[ValuationPoint]` |
| **`GET`** | `/api/players/{player_id}/performance` | Trailing & career stats | `player_id` | `PerformanceSummary` |
| **`GET`** | `/api/players/{player_id}/transfers` | Transfer history & fees | `player_id` | `List[TransferResponse]` |
| **`GET`** | `/api/players/compare` | Multi-player comparison | `player_ids` (comma-separated IDs) | `PlayerComparisonResponse` |

---

## 5. Performance Measurements & Automated Test Results

Executed automated Pytest integration test suite (`backend/tests/test_api.py`):

| Test Case | Description | Measured Latency | Status |
| :--- | :--- | ---: | :--- |
| `test_health_endpoint` | GET `/api/health` | **9.49 ms** | **PASS** |
| `test_list_players_endpoint` | GET `/api/players` (Pagination over 50,149 records) | **47.88 ms** | **PASS** |
| `test_player_search_endpoint` | GET `/api/players?search=Haaland` | **37.14 ms** | **PASS** |
| `test_player_detail_endpoint` | GET `/api/players/10` | **66.53 ms** | **PASS** |
| `test_player_valuation_prediction_endpoint` | GET `/api/players/10/valuation` | **26.46 ms** | **PASS** |
| `test_player_comparison_endpoint` | GET `/api/players/compare?player_ids=10,11` | **66.23 ms** | **PASS** |
| `test_invalid_player_id` | GET `/api/players/99999999` | **4.12 ms** | **PASS (404)** |

**Pytest Overview**: **7 passed out of 7 tests (100% PASS) in 2.86 seconds**.

---

## 6. Model Integration & Explainability Architecture

* **Model Loading**: Singleton `ValuationService` loads `best_model.joblib` at FastAPI application startup.
* **Model Versioning**: Configured centrally as `xgboost-v1`.
* **Uncertainty Bounds**: Calculates 80% prediction interval bounds ($[\text{lower\_bound}, \text{upper\_bound}]$) using log-space residual quantiles ($q_{10} = -0.3802$, $q_{90} = +0.3633$).
* **Explanations**: Generates player-specific positive and negative factor lists based on feature thresholds.

---

## 7. Caching & Database Performance Decisions

* **Database Indexing**: Explicit multi-column composite indexes added to `player_market_values(player_id, valuation_date)`, `transfers(player_id, transfer_date)`, `player_appearances(player_id, date)`, and `player_predictions(player_id, prediction_date)`.
* **Caching Strategy**: Sub-100ms response times achieved natively with indexed queries; external Redis caching evaluated and deemed unnecessary at this phase to minimize infrastructure complexity.

---

## 8. Reproducibility Instructions

1. **Database Migration / Creation**:
   ```powershell
   python scripts/load_database.py
   ```
2. **Run Backend Server**:
   ```powershell
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
3. **Execute Integration Test Suite**:
   ```powershell
   python -m pytest backend/tests/test_api.py -v
   ```

---

## STOP CONDITION

> [!IMPORTANT]
> **PHASE 4 COMPLETE — WAITING FOR USER APPROVAL**  
> Phase 4 FastAPI backend architecture, relational database schema, database loading, ML inference integration, and Pytest verification suite are 100% complete.  
> 
> **Next Step**: Awaiting your review and explicit approval before initiating **PHASE 5 — CINEMATIC PWA FRONTEND**.
