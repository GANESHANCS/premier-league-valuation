# PHASE 2 — FEATURE DICTIONARY & ML DATASET AUDIT DOCUMENT
**Application**: Premier League Valuation Intelligence (PL ValuEdge)  
**Phase**: Phase 2 — Temporal Feature Engineering & Dataset Preparation  
**Execution Date**: August 2026  
**Status**: Completed & Verified (Anti-Leakage Audit: PASS)  

---

## 1. Machine Learning Unit of Observation

* **Unit of Observation**: **`Player-Valuation-Date`**
* **Rationale**: Each row in `ml_dataset_full.csv` represents a single time-stamped market value observation $T_{\text{val}}$ for a Premier League player. By indexing observations on $(P, T_{\text{val}})$, all trailing performance metrics, historical valuation trajectories, transfer events, and age metrics are strictly bounded to information available $\le T_{\text{val}}$. This maximizes temporal fidelity, provides 23,768 realistic prediction points, and eliminates future lookahead bias.

---

## 2. Feature Dictionary

| Feature Name | Type | Definition | Source File | Time Rule | Missing Value Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`target_market_value_eur`** | Numeric (€) | Observed market valuation at date $T_{\text{val}}$ (Ground Truth Target) | `player_valuations.csv` | Observed at $T_{\text{val}}$ | Filtered out if missing. |
| **`target_log_market_value`** | Numeric | $\ln(\text{target\_market\_value\_eur} + 1)$ used for skewed ML target modeling | `player_valuations.csv` | Observed at $T_{\text{val}}$ | Filtered out if missing. |
| **`age_at_valuation`** | Numeric | Player age in years on valuation date $T_{\text{val}}$ | `players.csv` | $(T_{\text{val}} - \text{DOB}) / 365.25$ | Filtered out if DOB missing. |
| **`age_squared`** | Numeric | $\text{age\_at\_valuation}^2$ to capture non-linear age curve | Derived | Calculated at $T_{\text{val}}$ | Derived from age. |
| **`main_position`** | Categorical | Primary position group (`Goalkeeper`, `Defender`, `Midfielder`, `Forward`) | `players.csv` | Static attribute | Categorized from position. |
| **`sub_position`** | Categorical | Granular position role (e.g. `Centre-Back`, `Attacking Midfield`) | `players.csv` | Static attribute | `Unknown` if missing. |
| **`foot`** | Categorical | Preferred playing foot (`right`, `left`, `both`, `Unknown`) | `players.csv` | Static attribute | Imputed as `'Unknown'`, flag `foot_imputed`. |
| **`height_in_cm`** | Numeric (cm) | Player height in centimeters | `players.csv` | Static attribute | Imputed via position median, flag `height_imputed`. |
| **`apps_365d`** | Integer | Total match appearances in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`starts_365d`** | Integer | Starts ($\ge 45$ mins) in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`minutes_365d`** | Integer | Total minutes played in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`goals_365d`** | Integer | Goals scored in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`assists_365d`** | Integer | Assists provided in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`yellows_365d`** | Integer | Yellow cards in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`reds_365d`** | Integer | Red cards in trailing 365 days prior to $T_{\text{val}}$ | `appearances.csv` | $T_{\text{val}} - 365\text{d} \le \text{date} < T_{\text{val}}$ | Default `0`. |
| **`goals_per90_365d`** | Numeric | Goals per 90 minutes in trailing 365 days | Derived | $\text{goals\_365d} / (\text{minutes\_365d} / 90)$ | Default `0.0`. |
| **`assists_per90_365d`** | Numeric | Assists per 90 minutes in trailing 365 days | Derived | $\text{assists\_365d} / (\text{minutes\_365d} / 90)$ | Default `0.0`. |
| **`contribs_per90_365d`**| Numeric | Goal contributions (G+A) per 90 minutes in trailing 365 days | Derived | $(\text{G} + \text{A}) / (\text{Min} / 90)$ | Default `0.0`. |
| **`career_apps_prior`**| Integer | Total career appearances recorded strictly prior to $T_{\text{val}}$ | `appearances.csv` | $\text{date} < T_{\text{val}}$ | Default `0`. |
| **`career_minutes_prior`**| Integer | Total career minutes played strictly prior to $T_{\text{val}}$ | `appearances.csv` | $\text{date} < T_{\text{val}}$ | Default `0`. |
| **`career_goals_prior`**| Integer | Total career goals scored strictly prior to $T_{\text{val}}$ | `appearances.csv` | $\text{date} < T_{\text{val}}$ | Default `0`. |
| **`career_assists_prior`**| Integer | Total career assists strictly prior to $T_{\text{val}}$ | `appearances.csv` | $\text{date} < T_{\text{val}}$ | Default `0`. |
| **`prev_market_value_eur`**| Numeric (€) | Most recent valuation recorded strictly prior to $T_{\text{val}}$ | `player_valuations.csv` | $\text{date} < T_{\text{val}}$ | Retained as `NaN` (First valuation). |
| **`days_since_prev_val`**| Numeric | Days elapsed since most recent prior valuation | Derived | $T_{\text{val}} - \text{prev\_val\_date}$ | Retained as `NaN`. |
| **`hist_max_value_eur`** | Numeric (€) | Maximum historical market value recorded prior to $T_{\text{val}}$ | `player_valuations.csv` | $\text{date} < T_{\text{val}}$ | Retained as `NaN`. |
| **`hist_min_value_eur`** | Numeric (€) | Minimum historical market value recorded prior to $T_{\text{val}}$ | `player_valuations.csv` | $\text{date} < T_{\text{val}}$ | Retained as `NaN`. |
| **`val_count_prior`** | Integer | Total count of valuation observations prior to $T_{\text{val}}$ | `player_valuations.csv` | $\text{date} < T_{\text{val}}$ | Default `0`. |
| **`val_change_365d`** | Numeric (€) | Absolute valuation change over trailing 365 days | Derived | $\text{prev\_val} - \text{val\_1y\_ago}$ | Default `0.0`. |
| **`val_growth_ratio_365d`**| Numeric | Relative valuation growth ratio over trailing 365 days | Derived | $(\text{prev\_val} + 1) / (\text{val\_1y\_ago} + 1)$ | Default `1.0`. |
| **`prev_transfer_fee_eur`**| Numeric (€) | Fee from most recent transfer $\le T_{\text{val}}$ | `transfers.csv` | $\text{transfer\_date} \le T_{\text{val}}$ | Retained as `NaN` (Undisclosed / No transfer). |
| **`prev_transfer_fee_status`**| Categorical | Fee status (`disclosed`, `free_transfer`, `undisclosed`, `no_prior_transfer`)| `transfers.csv` | $\text{transfer\_date} \le T_{\text{val}}$ | Explicit status code. |
| **`days_since_prev_transfer`**| Numeric | Days elapsed since most recent transfer $\le T_{\text{val}}$ | Derived | $T_{\text{val}} - \text{prev\_transfer\_date}$ | Retained as `NaN`. |
| **`total_prior_transfers`**| Integer | Total transfer count prior to or at $T_{\text{val}}$ | `transfers.csv` | $\text{transfer\_date} \le T_{\text{val}}$ | Default `0`. |

---

## 3. Dataset Chronological Split Strategy

To eliminate data leakage, we enforce a strict **out-of-time chronological split**:

```
01-07-2015                      30-06-2022          30-06-2023                 12-06-2026
┌───────────────────────────────────┬───────────────────┬──────────────────────────┐
│             TRAIN SET             │  VALIDATION SET   │     OUT-OF-TIME TEST     │
│       14,471 Observations         │ 3,151 Observations│    6,146 Observations    │
│        (60.9% of Dataset)         │ (13.3% of Dataset)│    (25.9% of Dataset)    │
└───────────────────────────────────┴───────────────────┴──────────────────────────┘
```

---

## 4. Programmatic Anti-Leakage Audit Results

The automated anti-leakage audit script (`src/ml/leakage/verify_anti_leakage.py`) executed 5 assertions:
1. `max_feature_info_date <= target_valuation_date`: **PASS (0 violations)**
2. `days_since_prev_val >= 0 or NaN`: **PASS (0 violations)**
3. `days_since_prev_transfer >= 0 or NaN`: **PASS (0 violations)**
4. Primary Key Uniqueness `(player_id, valuation_date)`: **PASS (0 duplicates)**
5. Target Variable Exclusion from Features: **PASS (Target strictly excluded)**

**OVERALL AUDIT STATUS**: **PASS [100% CLEAN]**

---

## 5. Reproducibility

To regenerate the ML feature dataset, dataset splits, metadata JSON, and run the anti-leakage audit:

```powershell
python scripts/run_phase2_pipeline.py
```
