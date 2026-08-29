import json
import pandas as pd
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"

# Strict Chronological Splitting Bounds
TRAIN_END_DATE = "2022-06-30"
VAL_START_DATE = "2022-07-01"
VAL_END_DATE = "2023-06-30"
TEST_START_DATE = "2023-07-01"

def prepare_and_split_dataset(df_ml: pd.DataFrame):
    print("[*] Running Dataset Preparation & Chronological Split...")
    ML_DATA_DIR.mkdir(parents=True, exist_ok=True)

    df_ml['valuation_date_dt'] = pd.to_datetime(df_ml['valuation_date'])
    df_ml = df_ml.sort_values(['valuation_date_dt', 'player_id']).reset_index(drop=True)

    # 1. Perform Chronological Splits
    train_df = df_ml[df_ml['valuation_date_dt'] <= TRAIN_END_DATE].copy()
    val_df = df_ml[(df_ml['valuation_date_dt'] >= VAL_START_DATE) & (df_ml['valuation_date_dt'] <= VAL_END_DATE)].copy()
    test_df = df_ml[df_ml['valuation_date_dt'] >= TEST_START_DATE].copy()

    # Drop temporary sorting helper
    df_ml = df_ml.drop(columns=['valuation_date_dt'])
    train_df = train_df.drop(columns=['valuation_date_dt'])
    val_df = val_df.drop(columns=['valuation_date_dt'])
    test_df = test_df.drop(columns=['valuation_date_dt'])

    # 2. Save CSV datasets
    full_path = ML_DATA_DIR / "ml_dataset_full.csv"
    train_path = ML_DATA_DIR / "ml_dataset_train.csv"
    val_path = ML_DATA_DIR / "ml_dataset_val.csv"
    test_path = ML_DATA_DIR / "ml_dataset_test.csv"

    df_ml.to_csv(full_path, index=False)
    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    # 3. Calculate Missingness & Summary Stats
    missing_pct = df_ml.isnull().mean().to_dict()
    
    metadata = {
        "dataset_name": "Premier League Valuation ML Dataset",
        "created_at": datetime.now().isoformat(),
        "total_observations": len(df_ml),
        "total_unique_players": int(df_ml['player_id'].nunique()),
        "feature_count": len(df_ml.columns),
        "earliest_valuation_date": df_ml['valuation_date'].min(),
        "latest_valuation_date": df_ml['valuation_date'].max(),
        "target_stats_eur": {
            "min": float(df_ml['target_market_value_eur'].min()),
            "p25": float(df_ml['target_market_value_eur'].quantile(0.25)),
            "median": float(df_ml['target_market_value_eur'].median()),
            "mean": float(df_ml['target_market_value_eur'].mean()),
            "p75": float(df_ml['target_market_value_eur'].quantile(0.75)),
            "max": float(df_ml['target_market_value_eur'].max())
        },
        "chronological_splits": {
            "train": {
                "observations": len(train_df),
                "unique_players": int(train_df['player_id'].nunique()),
                "date_range": [train_df['valuation_date'].min(), train_df['valuation_date'].max()] if len(train_df) > 0 else []
            },
            "validation": {
                "observations": len(val_df),
                "unique_players": int(val_df['player_id'].nunique()),
                "date_range": [val_df['valuation_date'].min(), val_df['valuation_date'].max()] if len(val_df) > 0 else []
            },
            "test": {
                "observations": len(test_df),
                "unique_players": int(test_df['player_id'].nunique()),
                "date_range": [test_df['valuation_date'].min(), test_df['valuation_date'].max()] if len(test_df) > 0 else []
            }
        },
        "missing_percentage_by_feature": missing_pct
    }

    metadata_path = ML_DATA_DIR / "ml_dataset_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"    [+] Full ML Dataset Saved: {full_path.name} ({len(df_ml):,d} rows)")
    print(f"    [+] Train Split Saved: {train_path.name} ({len(train_df):,d} rows)")
    print(f"    [+] Validation Split Saved: {val_path.name} ({len(val_df):,d} rows)")
    print(f"    [+] Test Split Saved: {test_path.name} ({len(test_df):,d} rows)")
    print(f"    [+] Metadata & Audit JSON Written to: {metadata_path.name}")

    return metadata

if __name__ == "__main__":
    from src.ml.features.build_features import build_temporal_features
    df_ml = build_temporal_features()
    prepare_and_split_dataset(df_ml)
