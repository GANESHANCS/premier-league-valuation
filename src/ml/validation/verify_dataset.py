import json
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"

def run_dataset_verification():
    print("==========================================================================")
    print("      PL VALUEDGE - ML DATASET QUALITY & INTEGRITY REPORT                 ")
    print("==========================================================================")

    full_path = ML_DATA_DIR / "ml_dataset_full.csv"
    train_path = ML_DATA_DIR / "ml_dataset_train.csv"
    val_path = ML_DATA_DIR / "ml_dataset_val.csv"
    test_path = ML_DATA_DIR / "ml_dataset_test.csv"

    if not full_path.exists():
        print("[!] ML Dataset file not found. Run pipeline first.")
        return

    full_df = pd.read_csv(full_path)
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)
    test_df = pd.read_csv(test_path)

    print(f"\n--- DATASET OVERVIEW ---")
    print(f"  * Total Observations: {len(full_df):,d}")
    print(f"  * Unique Players: {full_df['player_id'].nunique():,d}")
    print(f"  * Total Features: {len(full_df.columns):,d}")
    print(f"  * Valuation Date Range: {full_df['valuation_date'].min()} to {full_df['valuation_date'].max()}")

    print(f"\n--- CHRONOLOGICAL SPLIT DISTRIBUTIONS ---")
    print(f"  * Train Set (2015-07-01 to 2022-06-30): {len(train_df):>6,d} rows ({len(train_df)/len(full_df)*100:.1f}%) | {train_df['player_id'].nunique():>4,d} unique players")
    print(f"  * Val Set   (2022-07-01 to 2023-06-30): {len(val_df):>6,d} rows ({len(val_df)/len(full_df)*100:.1f}%) | {val_df['player_id'].nunique():>4,d} unique players")
    print(f"  * Test Set  (2023-07-01 to 2026-06-12): {len(test_df):>6,d} rows ({len(test_df)/len(full_df)*100:.1f}%) | {test_df['player_id'].nunique():>4,d} unique players")

    print(f"\n--- TARGET DISTRIBUTION (Observed Market Value EUR) ---")
    mv = full_df['target_market_value_eur']
    print(f"  * Minimum   : €{mv.min():>12,.0f}")
    print(f"  * 25th Pct  : €{mv.quantile(0.25):>12,.0f}")
    print(f"  * Median    : €{mv.median():>12,.0f}")
    print(f"  * Mean      : €{mv.mean():>12,.0f}")
    print(f"  * 75th Pct  : €{mv.quantile(0.75):>12,.0f}")
    print(f"  * Maximum   : €{mv.max():>12,.0f}")

    print(f"\n--- MISSING VALUE ANALYSIS ---")
    null_counts = full_df.isnull().sum()
    null_cols = null_counts[null_counts > 0]
    if len(null_cols) == 0:
        print("  * Zero missing values across all features!")
    else:
        for col, count in null_cols.items():
            print(f"  * {col:30s}: {count:>6,d} missing ({count/len(full_df)*100:.1f}%)")

    print("\n[OK] ML Dataset Integrity Verification Complete.")

if __name__ == "__main__":
    run_dataset_verification()
