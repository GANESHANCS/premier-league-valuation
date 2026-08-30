# PL ValuEdge — Production API Specification

> **Authoritative REST API Contract Documentation**  
> *FastAPI Engine Interface Specification for PL ValuEdge Backend Services*

---

## Base URLs

- **Production API**: `https://pl-valuedge-backend.onrender.com`
- **Local Development**: `http://localhost:8000`

---

## Common Headers

- `Accept`: `application/json`
- `Content-Type`: `application/json`

---

## Endpoints Summary

1. `GET /api/health` — System Health & Model Status
2. `GET /api/dashboard/summary` — High-Level Dashboard Intelligence Summary
3. `GET /api/players` — Filterable Player Scouting Matrix (Paginated)
4. `GET /api/players/{id}` — Individual Player Dossier & Valuation History
5. `GET /api/players/{id}/valuation` — Player Fair Value Prediction & 80% Intervals
6. `GET /api/players/compare` — Multi-Player Side-by-Side Comparison Vector
7. `GET /api/transfers` — Global Transfer Movement Feed (Historical & Future)
8. `GET /api/model/analytics` — Model Metrics, Permutation Importances & Calibration

---

## 1. System Health (`GET /api/health`)

**Purpose**: Verifies backend system availability, database connectivity, and ML model loaded status. Used by Render container HEALTHCHECK.

- **HTTP Method**: `GET`
- **Path**: `/api/health`
- **Query Parameters**: None
- **Response**: `200 OK`

### Example Response Structure
```json
{
  "status": "healthy",
  "service": "pl-valuedge-backend",
  "version": "1.0.0",
  "environment": "production",
  "database": "healthy",
  "model_version": "xgboost-v1",
  "model": {
    "status": "loaded",
    "name": "XGBoost Regressor",
    "features_count": 32
  }
}
```

---

## 2. Dashboard Summary (`GET /api/dashboard/summary`)

**Purpose**: Provides high-level aggregate counts, latest valuation date, model metrics, top 5 undervalued players, and top 5 overvalued players.

- **HTTP Method**: `GET`
- **Path**: `/api/dashboard/summary`
- **Query Parameters**: None
- **Response**: `200 OK`

### Example Response Structure
```json
{
  "total_players": 50149,
  "total_valuations": 656301,
  "total_transfers": 175165,
  "latest_valuation_date": "2026-06-12",
  "model_version": "xgboost-v1",
  "model_out_of_time_wape_pct": 12.89,
  "model_out_of_time_r2": 0.9457,
  "model_cv_wape_pct": 15.20,
  "model_cv_r2": 0.9577,
  "top_undervalued": [
    {
      "player_id": 418560,
      "name": "Erling Haaland",
      "club_name": "Manchester City",
      "position": "Attack",
      "observed_market_value_eur": 180000000,
      "predicted_fair_value_eur": 210500000,
      "valuation_gap_eur": 30500000,
      "valuation_gap_pct": 16.94,
      "signal": "UNDERVALUED"
    }
  ],
  "top_overvalued": []
}
```

---

## 3. Player Scouting Matrix (`GET /api/players`)

**Purpose**: Search, filter, and paginate through professional player records.

- **HTTP Method**: `GET`
- **Path**: `/api/players`
- **Query Parameters**:
  - `search` (string, optional): Search query matching player name.
  - `league` (string, optional): League code filter (`GB1` for Premier League, `all` for global scope). Default: `GB1`.
  - `position` (string, optional): Filter by position category (`Goalkeeper`, `Defender`, `Midfielder`, `Attack`).
  - `signal` (string, optional): Filter by valuation signal (`UNDERVALUED`, `OVERVALUED`, `FAIR VALUE`).
  - `page` (int, optional): Page number (1-indexed). Default: `1`.
  - `page_size` (int, optional): Items per page (max 100). Default: `20`.

### Example Response Structure
```json
{
  "items": [
    {
      "player_id": 418560,
      "name": "Erling Haaland",
      "position": "Attack",
      "sub_position": "Centre-Forward",
      "age": 25,
      "foot": "left",
      "height_in_cm": 195,
      "current_club": {
        "club_id": 281,
        "name": "Manchester City"
      },
      "latest_observed_market_value_eur": 180000000,
      "latest_valuation_date": "2026-06-12",
      "prediction": {
        "predicted_fair_value_eur": 210500000,
        "lower_bound_eur": 143990847,
        "upper_bound_eur": 302787884,
        "valuation_gap_eur": 30500000,
        "valuation_gap_pct": 16.94,
        "signal": "UNDERVALUED"
      }
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 2259,
    "total_pages": 113
  }
}
```

---

## 4. Player Detail Profile (`GET /api/players/{id}`)

**Purpose**: Retrieves complete dossier for a single player including full historical valuation timeline, performance stats, transfer log, and model prediction.

- **HTTP Method**: `GET`
- **Path**: `/api/players/{id}`
- **Path Parameters**:
  - `id` (int, required): Unique player ID.
- **Response**: `200 OK` or `404 Not Found`.

---

## 5. Player Valuation Prediction (`GET /api/players/{id}/valuation`)

**Purpose**: Returns XGBoost valuation prediction, 80% prediction interval bounds, gap metrics, and feature factor breakdowns for a player.

- **HTTP Method**: `GET`
- **Path**: `/api/players/{id}/valuation`
- **Path Parameters**:
  - `id` (int, required): Unique player ID.
- **Response**: `200 OK` or `404 Not Found`.

---

## 6. Multi-Player Comparison (`GET /api/players/compare`)

**Purpose**: Returns side-by-side comparative feature vectors for up to 6 players simultaneously.

- **HTTP Method**: `GET`
- **Path**: `/api/players/compare`
- **Query Parameters**:
  - `player_ids` (string, required): Comma-separated list of player IDs (e.g. `418560,342229`).
- **Response**: `200 OK`.

---

## 7. Global Transfer Feed (`GET /api/transfers`)

**Purpose**: Retrieves filterable historical and future scheduled transfer movement records across clubs.

- **HTTP Method**: `GET`
- **Path**: `/api/transfers`
- **Query Parameters**:
  - `scope` (string, optional): Transfer temporal scope (`historical` for past transfers, `future` for upcoming transfers). Default: `historical`.
  - `page` (int, optional): Page number. Default: `1`.
  - `page_size` (int, optional): Items per page. Default: `20`.

---

## 8. Model Analytics (`GET /api/model/analytics`)

**Purpose**: Exposes Phase 3 XGBoost evaluation metrics, out-of-time test scores, 15 permutation feature importances, prediction interval quantiles, tier error calibration, and position error calibration.

- **HTTP Method**: `GET`
- **Path**: `/api/model/analytics`
- **Query Parameters**: None
- **Response**: `200 OK`

### Example Response Structure
```json
{
  "model_name": "XGBoost",
  "model_version": "xgboost-v1",
  "out_of_time_test_metrics": {
    "MAE_EUR": 2255249.92,
    "MedAE_EUR": 877417.5,
    "RMSE_EUR": 4950696.25,
    "R2": 0.9457,
    "WAPE": 0.1289,
    "Log_MAE": 0.2090,
    "Log_RMSE": 0.3457
  },
  "validation_metrics": {
    "MAE_EUR": 1376134.27,
    "MedAE_EUR": 310112.75,
    "RMSE_EUR": 3210600.95,
    "R2": 0.9577,
    "WAPE": 0.1520,
    "Log_MAE": 0.2564,
    "Log_RMSE": 0.3983
  },
  "feature_importances": [
    {
      "feature": "prev_market_value_eur",
      "importance_mean": 1.367870231600225,
      "importance_std": 0.03858660177252401
    },
    {
      "feature": "val_count_prior",
      "importance_mean": 0.07422079410624212,
      "importance_std": 0.002008100256184254
    }
  ],
  "uncertainty_quantile_residuals_log": {
    "p10": -0.3802,
    "p90": 0.3633
  }
}
```
