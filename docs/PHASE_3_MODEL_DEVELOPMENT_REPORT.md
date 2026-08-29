# PHASE 3 — MACHINE LEARNING MODEL DEVELOPMENT REPORT
**Application**: Premier League Valuation Intelligence (PL ValuEdge)  
**Phase**: Phase 3 — Machine Learning Model Development  
**Execution Date**: August 2026  
**Status**: Completed, Evaluated & Committed  

---

## Executive Summary

Phase 3 developed, evaluated, and validated machine learning models for estimating **Predicted Fair Value** ($\hat{y}_{\text{eur}}$) for Premier League players strictly using time-valid historical features available at prediction date $T_{\text{val}}$.

We established 4 baseline models, evaluated 5 candidate ML algorithms using `TimeSeriesSplit` temporal cross-validation, conducted detailed error analysis across 5 domain dimensions, built an 80% prediction interval uncertainty model, and executed a one-time evaluation on the untouched out-of-time test set (`2023-07-01` to `2026-06-12`).

**Winning Model**: **XGBoost Regressor Pipeline** (`best_model.joblib`), achieving an out-of-time test **WAPE of 14.86%**, **MAE of €1,689,451**, **Median Absolute Error of €357,173**, and **$R^2$ of 0.9542**.

---

## 1. Dataset & Split Governance

| Dataset Split | Date Range | Observation Count | Unique Players | Role in Phase 3 |
| :--- | :--- | :--- | :--- | :--- |
| **Train Set** | `2015-07-01` to `2022-06-30` | 14,471 rows (60.9%) | 1,525 players | Model training & 5-fold TimeSeriesSplit CV |
| **Validation Set** | `2022-07-01` to `2023-06-30` | 3,151 rows (13.3%) | 1,305 players | Hyperparameter tuning & model candidate selection |
| **Out-of-Time Test Set** | `2023-07-01` to `2026-06-12` | 6,146 rows (25.9%) | 1,043 players | **Untouched final one-time evaluation ONLY** |

---

## 2. Baseline Model Performance (Validation Set: 3,151 Rows)

| Baseline Model | MAE (€) | MedAE (€) | RMSE (€) | $R^2$ Score | WAPE (%) | Log RMSE |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| **Baseline A (Previous Market Value)** | €1,402,686 | €300,000 | €3,299,190 | 0.9553 | **15.49%** | 0.4357 |
| **Baseline B (Historical Maximum)** | €2,503,634 | €500,000 | €6,448,720 | 0.8290 | **27.65%** | 0.5960 |
| **Baseline C (Age & Position Ridge)** | €7,761,643 | €2,107,358 | €18,485,389 | -0.4042 | **85.73%** | 1.3412 |
| **Baseline D (Position x Age Bracket Median)**| €7,433,086 | €1,500,000 | €17,678,610 | -0.2842 | **82.10%** | 1.2589 |

---

## 3. Candidate Model Evaluation & Selection (Validation Set)

| Candidate Model | MAE (€) | MedAE (€) | RMSE (€) | $R^2$ Score | WAPE (%) | Log RMSE | Selection Status |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| **Ridge Regression** | €11,924,170 | €941,682 | €129,956,000 | -68.36 | 131.70% | 0.9679 | Rejected (Linear instability) |
| **ElasticNet Regression** | €14,595,310 | €893,002 | €307,629,700 | -387.68 | 161.20% | 1.0438 | Rejected (Linear instability) |
| **Random Forest** | €1,437,646 | €320,238 | €3,193,841 | 0.9581 | 15.88% | 0.4164 | Candidate (Strong) |
| **LightGBM** | €1,387,970 | €321,649 | €3,279,551 | 0.9558 | 15.33% | 0.4004 | Candidate (Strong) |
| **XGBoost Regressor** | **€1,376,134** | **€310,113** | **€3,210,601** | **0.9577** | **15.20%** | **0.3983** | **WINNER (Selected)** |

---

## 4. Final Out-of-Time Test Set Results (Untouched Test Data)

The selected **XGBoost Regressor** pipeline was evaluated ONCE on the held-out test set (`2023-07-01` to `2026-06-12`, 6,146 observations):

* **Test Mean Absolute Error (MAE)**: **€1,689,451**
* **Test Median Absolute Error (MedAE)**: **€357,173**
* **Test Root Mean Squared Error (RMSE)**: **€4,642,892**
* **Test Coefficient of Determination ($R^2$)**: **0.9542** (95.42% variance explained)
* **Test Weighted Absolute Percentage Error (WAPE)**: **14.86%**
* **Test Log RMSE**: **0.3917**

---

## 5. Detailed Error Analysis & Calibration Breakdown

### A. Performance by Value Tier
| Value Tier | Sample Count | MAE (€) | MedAE (€) | WAPE (%) | Interpretation |
| :--- | ---: | ---: | ---: | ---: | :--- |
| **$< €1\text{M}$** | 912 | €160,865 | €78,574 | 36.2% | Small absolute error, higher relative percentage due to low denominator |
| **$€1\text{M} - €5\text{M}$** | 1,123 | €626,793 | €387,700 | 23.9% | Strong general squad player accuracy |
| **$€5\text{M} - €20\text{M}$** | 683 | €1,712,796 | €1,130,477 | 16.6% | High precision on established Premier League starters |
| **$€20\text{M} - €50\text{M}$** | 323 | €3,803,153 | €2,504,500 | 12.5% | Excellent relative calibration for star players |
| **$> €50\text{M}$** | 110 | €8,328,527 | €5,556,125 | 11.2% | Lowest relative error (11.2% WAPE) on elite marquee players |

### B. Performance by Position
* **Goalkeeper**: MAE = **€839,475** | WAPE = **19.8%**
* **Defender**: MAE = **€1,180,698** | WAPE = **14.2%**
* **Midfielder**: MAE = **€1,577,159** | WAPE = **14.8%**
* **Forward**: MAE = **€1,694,983** | WAPE = **16.9%**

### C. Performance by Valuation Freshness
* **Fresh ($\le 90$ days)**: MAE = **€1,242,464** | WAPE = **13.9%** (Best performance)
* **Recent ($91-180$ days)**: MAE = **€2,033,643** | WAPE = **15.6%**
* **Stale ($>180$ days)**: MAE = **€852,711** | WAPE = **14.7%**
* **No Prior Valuation**: MAE = **€338,243** | WAPE = **65.9%** (Degrades without historical anchor)

---

## 6. Top 10 Feature Importances (Permutation Importance)

1. **`prev_market_value_eur`** (1.367870): Trailing historical market value observation.
2. **`val_count_prior`** (0.074221): Number of historical valuation updates recorded.
3. **`prev_transfer_fee_eur`** (0.031882): Most recent historical transfer fee realized.
4. **`total_prior_transfers`** (0.006068): Total career transfer frequency.
5. **`apps_365d`** (0.004300): Trailing 365-day match appearances.
6. **`age_at_valuation`** (0.003955): Player age profile at valuation date.
7. **`minutes_365d`** (0.003935): Trailing 365-day playing time volume.
8. **`val_change_365d`** (0.003773): Trailing 1-year valuation momentum.
9. **`days_since_prev_val`** (0.002567): Age/freshness of previous valuation update.
10. **`days_since_prev_transfer`** (0.001793): Recency of previous transfer move.

---

## 7. Prediction Intervals & Uncertainty Quantification

* **Methodology**: Empirical Residual Quantile Dispersion in Log Space ($10^{\text{th}}$ to $90^{\text{th}}$ Percentile Bounds).
* **Quantiles**: $q_{10} = -0.3802$, $q_{90} = +0.3633$.
* **80% Prediction Interval**: 
  $$\text{Interval} = \left[ \max\left(\exp(\hat{y}_{\text{log}} - 0.3802) - 1, 0\right), \, \exp(\hat{y}_{\text{log}} + 0.3633) - 1 \right]$$

---

## 8. Reproducibility & Model Artifacts

* **Pipeline Script**: `scripts/run_phase3_pipeline.py`
* **Saved Model Pipeline**: `data/processed/ml/best_model.joblib`
* **Metadata & Reports**: 
  * `data/processed/ml/phase3_model_summary.json`
  * `data/processed/ml/phase3_error_analysis.json`
  * `data/processed/ml/phase3_explainability_report.json`
* **Command to Reproduce**:
  ```powershell
  python scripts/run_phase3_pipeline.py
  ```

---

## STOP CONDITION

> [!IMPORTANT]
> **PHASE 3 COMPLETE — WAITING FOR USER APPROVAL**  
> Phase 3 ML model development, baseline comparison, candidate evaluation, out-of-time testing, error analysis, and explainability report generation are 100% complete.  
> 
> **Next Step**: Awaiting your review and explicit approval before initiating **PHASE 4 — DATABASE & BACKEND ARCHITECTURE**.
