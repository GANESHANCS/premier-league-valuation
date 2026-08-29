import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.inspection import permutation_importance

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"
MODEL_SAVE_PATH = ML_DATA_DIR / "best_model.joblib"
EXPLAINABILITY_SAVE_PATH = ML_DATA_DIR / "phase3_explainability_report.json"

def analyze_model_explainability():
    print("[*] Running Feature Importance & Explainability Analysis...")
    
    val_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_val.csv")
    pipeline = joblib.load(MODEL_SAVE_PATH)

    features = [c for c in val_df.columns if c not in [
        'player_id', 'valuation_id', 'valuation_date', 'target_market_value_eur',
        'target_log_market_value', 'max_feature_info_date'
    ]]

    X_val = val_df[features]
    y_val_log = val_df['target_log_market_value'].values

    # 1. Feature Importance Analysis
    print("  * Computing Permutation Feature Importance on Validation Set...")
    perm_importance = permutation_importance(pipeline, X_val, y_val_log, n_repeats=5, random_state=42, n_jobs=-1)
    
    importance_df = pd.DataFrame({
        'feature': features,
        'importance_mean': perm_importance.importances_mean,
        'importance_std': perm_importance.importances_std
    }).sort_values('importance_mean', ascending=False).reset_index(drop=True)

    print("\n--- TOP 10 PREDICTIVE FEATURES (Permutation Importance) ---")
    for idx, row in importance_df.head(10).iterrows():
        print(f"  {idx+1:2d}. {row['feature']:30s}: {row['importance_mean']:.6f} (+/- {row['importance_std']:.6f})")

    # 2. Prediction Interval / Uncertainty Bounds Computation
    # Calculate residual error distributions in log space per value tier
    y_val_eur = val_df['target_market_value_eur'].values
    val_pred_log = pipeline.predict(X_val)
    val_pred_eur = np.expm1(val_pred_log)

    log_residuals = y_val_log - val_pred_log
    q10_log_res = float(np.percentile(log_residuals, 10))
    q90_log_res = float(np.percentile(log_residuals, 90))

    print(f"\n--- UNCERTAINTY QUANTIFICATION (PREDICTION INTERVALS) ---")
    print(f"  * Residual Log Space 10th Percentile: {q10_log_res:.4f}")
    print(f"  * Residual Log Space 90th Percentile: {q90_log_res:.4f}")
    print("  * Methodology: Empirical Residual Quantile Dispersion (10th - 90th Percentile Bounds)")

    # 3. Demonstration Player Explanation Generator Function
    def explain_player_prediction(sample_row):
        p_name = sample_row.get('player_name', f"Player {sample_row['player_id']}")
        pred_log = pipeline.predict(pd.DataFrame([sample_row[features]]))[0]
        pred_eur = float(np.expm1(pred_log))
        
        # Calculate 80% Prediction Interval Bounds
        lower_bound = float(np.maximum(np.expm1(pred_log + q10_log_res), 0))
        upper_bound = float(np.expm1(pred_log + q90_log_res))

        positive_factors = []
        negative_factors = []

        if sample_row.get('prev_market_value_eur', 0) > 15e6:
            positive_factors.append(f"High previous market value (€{sample_row['prev_market_value_eur']/1e6:.1f}M)")
        if sample_row.get('goals_365d', 0) >= 10:
            positive_factors.append(f"Strong goalscoring record ({sample_row['goals_365d']} goals in trailing 365d)")
        if 21 <= sample_row.get('age_at_valuation', 0) <= 26:
            positive_factors.append(f"Prime peak age profile ({sample_row['age_at_valuation']:.1f} yrs)")

        if sample_row.get('age_at_valuation', 0) >= 32:
            negative_factors.append(f"Advanced age profile ({sample_row['age_at_valuation']:.1f} yrs)")
        if sample_row.get('minutes_365d', 0) < 900:
            negative_factors.append(f"Limited trailing playing time ({sample_row['minutes_365d']} mins)")
        if sample_row.get('days_since_prev_val', 0) > 180:
            negative_factors.append(f"Stale previous valuation ({int(sample_row['days_since_prev_val'])} days old)")

        return {
            "player_id": int(sample_row['player_id']),
            "valuation_date": sample_row['valuation_date'],
            "observed_market_value_eur": float(sample_row['target_market_value_eur']),
            "predicted_fair_value_eur": pred_eur,
            "prediction_interval_80_pct": [lower_bound, upper_bound],
            "valuation_gap_eur": pred_eur - float(sample_row['target_market_value_eur']),
            "key_positive_factors": positive_factors,
            "key_negative_factors": negative_factors
        }

    # Generate sample explanations
    sample_explanations = [explain_player_prediction(row) for _, row in val_df.head(3).iterrows()]

    report = {
        "top_features": importance_df.head(15).to_dict('records'),
        "uncertainty_quantile_residuals_log": {
            "p10": q10_log_res,
            "p90": q90_log_res
        },
        "sample_explanations": sample_explanations
    }

    with open(EXPLAINABILITY_SAVE_PATH, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n[OK] Explainability report written to: {EXPLAINABILITY_SAVE_PATH}")
    return report

if __name__ == "__main__":
    analyze_model_explainability()
