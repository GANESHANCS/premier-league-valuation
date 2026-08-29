import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.ml.features.build_features import build_temporal_features
from src.ml.preparation.prepare_dataset import prepare_and_split_dataset
from src.ml.leakage.verify_anti_leakage import run_anti_leakage_audit
from src.ml.validation.verify_dataset import run_dataset_verification

def main():
    print("==========================================================================")
    print("      EXECUTING PHASE 2 TEMPORAL FEATURE PIPELINE - PL VALUEDGE           ")
    print("==========================================================================")
    
    print("\n--- STEP 1: TEMPORAL FEATURE ENGINEERING ---")
    df_ml = build_temporal_features()

    print("\n--- STEP 2: DATASET PREPARATION & CHRONOLOGICAL SPLITS ---")
    prepare_and_split_dataset(df_ml)

    print("\n--- STEP 3: PROGRAMMATIC ANTI-LEAKAGE AUDIT ---")
    passed, status = run_anti_leakage_audit(df_ml)
    if not passed:
        print("[ERROR] Anti-leakage audit failed! Aborting pipeline.")
        sys.exit(1)

    print("\n--- STEP 4: DATASET QUALITY & INTEGRITY VERIFICATION ---")
    run_dataset_verification()

    print("\n==========================================================================")
    print("      [OK] PHASE 2 PIPELINE EXECUTED SUCCESSFULLY - ALL AUDITS PASSED    ")
    print("==========================================================================")

if __name__ == "__main__":
    main()
