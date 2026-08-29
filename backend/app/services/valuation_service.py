import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional
from backend.app.core.config import settings

class ValuationService:
    _instance = None
    pipeline = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ValuationService, cls).__new__(cls)
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        model_path = Path(settings.MODEL_PATH)
        if model_path.exists():
            print(f"[*] Loading XGBoost Model Pipeline from {model_path}...")
            self.pipeline = joblib.load(model_path)
            print("[OK] XGBoost Valuation Model Loaded Successfully!")
        else:
            print(f"[!] Warning: Model file not found at {model_path}. Prediction fallback active.")
            self.pipeline = None

    def predict_fair_value(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Runs model inference on feature dictionary and returns PredictionResponse data."""
        target_mv = feature_dict.get('target_market_value_eur', feature_dict.get('prev_market_value_eur', 1e6))
        if target_mv is None or pd.isna(target_mv) or target_mv <= 0:
            target_mv = 1e6

        if self.pipeline is None:
            # Fallback if model binary is missing
            pred_eur = target_mv
        else:
            df_feat = pd.DataFrame([feature_dict])
            try:
                pred_log = self.pipeline.predict(df_feat)[0]
                pred_eur = float(np.expm1(pred_log))
                pred_eur = float(np.maximum(pred_eur, 0))
            except Exception as e:
                print(f"[!] Inference exception: {e}. Falling back to baseline.")
                pred_eur = float(target_mv)

        # Log Space Uncertainty Bounds (10th & 90th residual quantiles from Phase 3 audit)
        q10_res = -0.3802
        q90_res = 0.3633

        pred_log_val = np.log1p(pred_eur)
        lower_bound = float(np.maximum(np.expm1(pred_log_val + q10_res), 0))
        upper_bound = float(np.expm1(pred_log_val + q90_res))

        gap_eur = pred_eur - float(target_mv)
        gap_pct = (gap_eur / float(target_mv)) * 100.0 if float(target_mv) > 0 else 0.0

        # Explanatory Factors Generation
        pos_factors = []
        neg_factors = []

        prev_val = feature_dict.get('prev_market_value_eur', 0)
        if prev_val and prev_val > 15e6:
            pos_factors.append(f"High historical market value benchmark (€{prev_val/1e6:.1f}M)")

        goals_365 = feature_dict.get('goals_365d', 0)
        if goals_365 and goals_365 >= 8:
            pos_factors.append(f"Strong trailing goalscoring contribution ({goals_365} goals)")

        age = feature_dict.get('age_at_valuation', 25)
        if age and 21 <= age <= 26:
            pos_factors.append(f"Prime peak athletic age profile ({age:.1f} yrs)")
        elif age and age >= 32:
            neg_factors.append(f"Advanced veteran age profile ({age:.1f} yrs)")

        mins_365 = feature_dict.get('minutes_365d', 0)
        if mins_365 and mins_365 < 900:
            neg_factors.append(f"Limited match action in trailing year ({mins_365} mins)")

        days_val = feature_dict.get('days_since_prev_val', 0)
        if days_val and days_val > 180:
            neg_factors.append(f"Stale historical valuation benchmark ({int(days_val)} days old)")

        return {
            "predicted_fair_value_eur": round(pred_eur, 2),
            "lower_bound_eur": round(lower_bound, 2),
            "upper_bound_eur": round(upper_bound, 2),
            "observed_market_value_eur": float(target_mv),
            "valuation_gap_eur": round(gap_eur, 2),
            "valuation_gap_pct": round(gap_pct, 2),
            "model_version": settings.MODEL_VERSION,
            "key_positive_factors": pos_factors,
            "key_negative_factors": neg_factors
        }

valuation_service = ValuationService()
