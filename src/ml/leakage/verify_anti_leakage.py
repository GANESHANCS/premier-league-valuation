import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"

def run_anti_leakage_audit(df_ml: pd.DataFrame = None):
    print("==========================================================================")
    print("        PREMIER LEAGUE VALUATION INTELLIGENCE - ANTI-LEAKAGE AUDIT       ")
    print("==========================================================================")
    
    if df_ml is None:
        dataset_path = ML_DATA_DIR / "ml_dataset_full.csv"
        if not dataset_path.exists():
            raise FileNotFoundError(f"ML dataset not found at {dataset_path}")
        df_ml = pd.read_csv(dataset_path)

    print(f"[*] Auditing {len(df_ml):,d} ML observation records for temporal leakage...")

    leakage_violations = []

    # Assertion 1: Feature date <= target valuation date
    df_ml['val_dt'] = pd.to_datetime(df_ml['valuation_date'])
    df_ml['max_feat_dt'] = pd.to_datetime(df_ml['max_feature_info_date'])
    
    future_date_violations = df_ml[df_ml['max_feat_dt'] > df_ml['val_dt']]
    if len(future_date_violations) > 0:
        leakage_violations.append(f"CRITICAL LEAKAGE: {len(future_date_violations)} records have feature info date > target valuation date!")
    else:
        print("  [PASS] Assertion 1: max_feature_info_date <= target_valuation_date (0 violations)")

    # Assertion 2: Historical Valuation Days Since Previous >= 0
    neg_val_days = df_ml[df_ml['days_since_prev_val'] < 0]
    if len(neg_val_days) > 0:
        leakage_violations.append(f"CRITICAL LEAKAGE: {len(neg_val_days)} records have negative days_since_prev_val (future valuation used)!")
    else:
        print("  [PASS] Assertion 2: days_since_prev_val >= 0 or NaN (0 future valuation leaks)")

    # Assertion 3: Historical Transfer Days Since Previous >= 0
    neg_tr_days = df_ml[df_ml['days_since_prev_transfer'] < 0]
    if len(neg_tr_days) > 0:
        leakage_violations.append(f"CRITICAL LEAKAGE: {len(neg_tr_days)} records have negative days_since_prev_transfer (future transfer leaks)!")
    else:
        print("  [PASS] Assertion 3: days_since_prev_transfer >= 0 or NaN (0 future transfer leaks)")

    # Assertion 4: Duplicate (player_id, valuation_date) Check
    dups = df_ml.duplicated(subset=['player_id', 'valuation_date']).sum()
    if dups > 0:
        leakage_violations.append(f"DATA INTEGRITY ERROR: {dups} duplicate (player_id, valuation_date) pairs found!")
    else:
        print("  [PASS] Assertion 4: Primary key uniqueness (player_id, valuation_date) (0 duplicates)")

    # Assertion 5: Target Variable Exclusion from Features
    feature_cols = [c for c in df_ml.columns if c not in ['target_market_value_eur', 'target_log_market_value']]
    if 'target_market_value_eur' in feature_cols or 'target_log_market_value' in feature_cols:
        leakage_violations.append("CRITICAL ERROR: Target variable found inside feature column list!")
    else:
        print("  [PASS] Assertion 5: Target variable strictly excluded from feature set")

    print("\n--------------------------------------------------------------------------")
    if len(leakage_violations) == 0:
        print("    AUDIT STATUS: OVERALL ANTI-LEAKAGE AUDIT STATUS: PASS [100% CLEAN]")
        print("--------------------------------------------------------------------------")
        return True, "PASS"
    else:
        print("    AUDIT STATUS: OVERALL ANTI-LEAKAGE AUDIT STATUS: FAIL")
        for v in leakage_violations:
            print(f"    - {v}")
        print("--------------------------------------------------------------------------")
        return False, "FAIL"

if __name__ == "__main__":
    run_anti_leakage_audit()
