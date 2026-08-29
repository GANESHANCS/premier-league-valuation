import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.ml.baselines.evaluate_baselines import evaluate_baselines
from src.ml.training.train_models import train_and_evaluate_candidates
from src.ml.evaluation.evaluate_models import run_error_analysis
from src.ml.explainability.explain_predictions import analyze_model_explainability

def main():
    print("==========================================================================")
    print("      EXECUTING PHASE 3 ML MODEL DEVELOPMENT PIPELINE - PL VALUEDGE       ")
    print("==========================================================================")

    print("\n--- STEP 1: EVALUATING STATISTICAL & HISTORICAL BASELINES ---")
    evaluate_baselines()

    print("\n--- STEP 2: CANDIDATE MODEL TRAINING, CROSS-VALIDATION & SELECTION ---")
    train_and_evaluate_candidates()

    print("\n--- STEP 3: ERROR ANALYSIS & CALIBRATION BREAKDOWN ---")
    run_error_analysis()

    print("\n--- STEP 4: FEATURE IMPORTANCE & MODEL EXPLAINABILITY ---")
    analyze_model_explainability()

    print("\n==========================================================================")
    print("      [OK] PHASE 3 PIPELINE EXECUTED SUCCESSFULLY - ALL AUDITS PASSED    ")
    print("==========================================================================")

if __name__ == "__main__":
    main()
