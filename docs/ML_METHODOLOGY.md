# PL ValuEdge — Machine Learning & Quantitative Methodology

> **Machine Learning Engineering, Feature Construction & Anti-Leakage Validation**

---

## 1. Machine Learning Target Formulation

The prediction target is a player's **Market Value in Euros (€)** on a given snapshot date $t$.

To handle exponential skewness in market values across multi-million Euro ranges, the target variable $y$ is log-transformed:

$$y = \log(1 + \text{market\_value\_eur})$$

Models predict $\hat{y}$ in log space, which is converted back to Euro values via exponential transformation:

$$\text{Predicted Fair Value (€)} = \exp(\hat{y}) - 1$$

---

## 2. Temporal Anti-Leakage Feature Engineering

To prevent data leakage, all 32 input features for valuation date $t$ are constructed **strictly using data recorded on or before date $t$**:

1. **Expanding Valuation Metrics**:
   - `prev_market_value_eur`: Latest observed market value prior to $t$.
   - `days_since_prev_val`: Days elapsed since previous valuation observation.
   - `val_count_prior`: Cumulative count of historical valuations prior to $t$.
   - `val_change_365d`: Absolute change in market value over trailing 365 days.
   - `val_growth_ratio_365d`: Relative growth ratio over trailing 365 days.

2. **Trailing 365-Day Performance Window**:
   - `apps_365d`, `starts_365d`, `minutes_365d`: Workload metrics in 365 days prior to $t$.
   - `goals_365d`, `assists_365d`, `yellows_365d`, `reds_365d`: Scoring and card discipline totals in 365 days prior to $t$.
   - `goals_per90_365d`, `assists_per90_365d`, `contribs_per90_365d`: Per-90 efficiency rates.

3. **Career Historical Totals**:
   - `career_apps_prior`, `career_minutes_prior`, `career_goals_prior`, `career_assists_prior`: Cumulative career totals prior to $t$.

4. **Transfer History**:
   - `prev_transfer_fee_eur`, `days_since_prev_transfer`, `total_prior_transfers`.

5. **Demographics**:
   - `age_at_valuation`, `age_squared` (non-linear age decay curve), `height_in_cm`, `main_position`, `sub_position`, `foot`.

---

## 3. XGBoost Model Architecture & Hyperparameters

- **Algorithm**: `xgboost.XGBRegressor`
- **Objective**: `reg:squarederror`
- **Hyperparameters**:
  - `n_estimators`: `500`
  - `learning_rate`: `0.05`
  - `max_depth`: `6`
  - `subsample`: `0.8`
  - `colsample_bytree`: `0.8`
  - `random_state`: `42`

---

## 4. Held-Out Out-of-Time Test Set Evaluation

- **Temporal Split**: Rather than random train/test splits, historical valuations prior to 2023 form the training data, while valuations from **2023 to 2026** form the held-out out-of-time test set.
- **Cross-Validation**: 5-Fold `TimeSeriesSplit` cross-validation across expanding historical temporal windows.

### Performance Summary
- **Out-of-Time Test WAPE**: **12.89%**
- **Out-of-Time Test $R^2$**: **0.9457**
- **Out-of-Time Test MAE**: **€2,255,249.92**
- **Out-of-Time Test MedAE**: **€877,417.50**
- **5-Fold TimeSeriesSplit CV WAPE**: **15.20%**
- **5-Fold TimeSeriesSplit CV $R^2$**: **0.9577**

---

## 5. Permutation Feature Importance

Permutation feature importance measures the increase in prediction error when feature values are permuted across test samples:

$$\text{Importance}(f) = \text{Loss}(\mathbf{X}_{\text{permuted}(f)}, \mathbf{y}) - \text{Loss}(\mathbf{X}, \mathbf{y})$$

### Top Features
1. `prev_market_value_eur`: **1.3679** (136.79% relative log sensitivity)
2. `val_count_prior`: **0.0742** (7.42% sensitivity)
3. `prev_transfer_fee_eur`: **0.0319** (3.19% sensitivity)
4. `total_prior_transfers`: **0.0061** (0.61% sensitivity)
5. `apps_365d`: **0.0043** (0.43% sensitivity)

---

## 6. Prediction Interval Methodology

Uncertainty bounds are computed using log-space residual quantiles computed on out-of-fold validation predictions:

- **10th Percentile Residual ($p_{10}$)**: `-0.3802`
- **90th Percentile Residual ($p_{90}$)**: `+0.3633`

The 80% empirical prediction interval for predicted value $\hat{V}$ is calculated as:

$$\text{Lower Bound (€)} = \hat{V} \times \exp(p_{10})$$
$$\text{Upper Bound (€)} = \hat{V} \times \exp(p_{90})$$
