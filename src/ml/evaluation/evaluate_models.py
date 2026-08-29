import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path
from src.ml.baselines.evaluate_baselines import calculate_metrics

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"
MODEL_SAVE_PATH = ML_DATA_DIR / "best_model.joblib"
ERROR_REPORT_PATH = ML_DATA_DIR / "phase3_error_analysis.json"

def run_error_analysis():
    print("[*] Running Detailed Model Error Analysis & Calibration Breakdown...")
    
    val_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_val.csv")
    pipeline = joblib.load(MODEL_SAVE_PATH)

    features = [c for c in val_df.columns if c not in [
        'player_id', 'valuation_id', 'valuation_date', 'target_market_value_eur',
        'target_log_market_value', 'max_feature_info_date'
    ]]

    y_val_eur = val_df['target_market_value_eur'].values
    val_pred_log = pipeline.predict(val_df[features])
    val_pred_eur = np.expm1(val_pred_log)
    val_pred_eur = np.maximum(val_pred_eur, 0)

    val_df['predicted_fair_value_eur'] = val_pred_eur
    val_df['abs_error_eur'] = np.abs(y_val_eur - val_pred_eur)
    val_df['valuation_gap_eur'] = val_pred_eur - y_val_eur

    # 1. Error Analysis by Value Tier
    tier_bins = [0, 1e6, 5e6, 20e6, 50e6, 1e9]
    tier_labels = ['< €1M', '€1M - €5M', '€5M - €20M', '€20M - €50M', '> €50M']
    val_df['value_tier'] = pd.cut(val_df['target_market_value_eur'], bins=tier_bins, labels=tier_labels)

    tier_metrics = {}
    print("\n--- ERROR ANALYSIS BY VALUE TIER ---")
    for tier in tier_labels:
        sub = val_df[val_df['value_tier'] == tier]
        if len(sub) > 0:
            m = calculate_metrics(sub['target_market_value_eur'], sub['predicted_fair_value_eur'])
            tier_metrics[tier] = m
            print(f"  * {tier:15s} (n={len(sub):>4,d}): MAE = €{m['MAE_EUR']:>10,.0f} | MedAE = €{m['MedAE_EUR']:>10,.0f} | WAPE = {m['WAPE']*100:>5.1f}%")

    # 2. Error Analysis by Age Group
    age_bins = [0, 21, 25, 29, 100]
    age_labels = ['<21 (Youth)', '21-25 (Developing)', '26-29 (Prime)', '30+ (Veteran)']
    val_df['age_group'] = pd.cut(val_df['age_at_valuation'], bins=age_bins, labels=age_labels)

    age_metrics = {}
    print("\n--- ERROR ANALYSIS BY AGE GROUP ---")
    for group in age_labels:
        sub = val_df[val_df['age_group'] == group]
        if len(sub) > 0:
            m = calculate_metrics(sub['target_market_value_eur'], sub['predicted_fair_value_eur'])
            age_metrics[group] = m
            print(f"  * {group:20s} (n={len(sub):>4,d}): MAE = €{m['MAE_EUR']:>10,.0f} | WAPE = {m['WAPE']*100:>5.1f}%")

    # 3. Error Analysis by Position
    pos_metrics = {}
    print("\n--- ERROR ANALYSIS BY POSITION ---")
    for pos in ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']:
        sub = val_df[val_df['main_position'] == pos]
        if len(sub) > 0:
            m = calculate_metrics(sub['target_market_value_eur'], sub['predicted_fair_value_eur'])
            pos_metrics[pos] = m
            print(f"  * {pos:15s} (n={len(sub):>4,d}): MAE = €{m['MAE_EUR']:>10,.0f} | WAPE = {m['WAPE']*100:>5.1f}%")

    # 4. Error Analysis by Previous Valuation Freshness
    def fresh_cat(days):
        if pd.isna(days):
            return 'No Prior Valuation'
        elif days <= 90:
            return 'Fresh (<=90d)'
        elif days <= 180:
            return 'Recent (91-180d)'
        else:
            return 'Stale (>180d)'

    val_df['freshness'] = val_df['days_since_prev_val'].apply(fresh_cat)
    fresh_metrics = {}
    print("\n--- ERROR ANALYSIS BY VALUATION FRESHNESS ---")
    for f_cat in ['Fresh (<=90d)', 'Recent (91-180d)', 'Stale (>180d)', 'No Prior Valuation']:
        sub = val_df[val_df['freshness'] == f_cat]
        if len(sub) > 0:
            m = calculate_metrics(sub['target_market_value_eur'], sub['predicted_fair_value_eur'])
            fresh_metrics[f_cat] = m
            print(f"  * {f_cat:20s} (n={len(sub):>4,d}): MAE = €{m['MAE_EUR']:>10,.0f} | WAPE = {m['WAPE']*100:>5.1f}%")

    # Save Analysis JSON
    error_analysis_data = {
        "tier_metrics": tier_metrics,
        "age_metrics": age_metrics,
        "position_metrics": pos_metrics,
        "freshness_metrics": fresh_metrics
    }
    with open(ERROR_REPORT_PATH, 'w') as f:
        json.dump(error_analysis_data, f, indent=2)

    print(f"\n[OK] Error analysis report saved to: {ERROR_REPORT_PATH}")
    return error_analysis_data

if __name__ == "__main__":
    run_error_analysis()
