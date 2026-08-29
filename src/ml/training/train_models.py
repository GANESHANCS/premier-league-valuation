import joblib
import json
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.linear_model import Ridge, ElasticNet
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

import lightgbm as lgb
import xgboost as xgb

from src.ml.baselines.evaluate_baselines import calculate_metrics

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"
MODEL_SAVE_PATH = ML_DATA_DIR / "best_model.joblib"
METADATA_SAVE_PATH = ML_DATA_DIR / "phase3_model_summary.json"

NUMERIC_FEATURES = [
    'age_at_valuation', 'age_squared', 'height_in_cm',
    'apps_365d', 'starts_365d', 'minutes_365d', 'goals_365d', 'assists_365d', 'yellows_365d', 'reds_365d',
    'goals_per90_365d', 'assists_per90_365d', 'contribs_per90_365d',
    'career_apps_prior', 'career_minutes_prior', 'career_goals_prior', 'career_assists_prior',
    'prev_market_value_eur', 'days_since_prev_val', 'hist_max_value_eur', 'hist_min_value_eur',
    'val_count_prior', 'val_change_365d', 'val_growth_ratio_365d',
    'prev_transfer_fee_eur', 'days_since_prev_transfer', 'total_prior_transfers'
]

CATEGORICAL_FEATURES = ['main_position', 'sub_position', 'foot', 'prev_transfer_fee_status']
BOOLEAN_FEATURES = ['height_imputed']

def get_preprocessor():
    num_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    cat_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', num_transformer, NUMERIC_FEATURES),
            ('cat', cat_transformer, CATEGORICAL_FEATURES),
            ('bool', 'passthrough', BOOLEAN_FEATURES)
        ]
    )
    return preprocessor

def train_and_evaluate_candidates():
    print("[*] Loading ML Data Splits...")
    train_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_train.csv")
    val_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_val.csv")
    test_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_test.csv")

    X_train = train_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES + BOOLEAN_FEATURES]
    y_train_eur = train_df['target_market_value_eur'].values
    y_train_log = train_df['target_log_market_value'].values

    X_val = val_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES + BOOLEAN_FEATURES]
    y_val_eur = val_df['target_market_value_eur'].values
    y_val_log = val_df['target_log_market_value'].values

    X_test = test_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES + BOOLEAN_FEATURES]
    y_test_eur = test_df['target_market_value_eur'].values

    print("\n[*] Performing TimeSeriesSplit Walk-Forward Cross Validation (5 folds)...")
    tscv = TimeSeriesSplit(n_splits=5)
    
    candidate_models = {
        "Ridge_Regression": Pipeline([
            ('preprocessor', get_preprocessor()),
            ('regressor', Ridge(alpha=100.0))
        ]),
        "ElasticNet_Regression": Pipeline([
            ('preprocessor', get_preprocessor()),
            ('regressor', ElasticNet(alpha=0.1, l1_ratio=0.5, max_iter=2000))
        ]),
        "Random_Forest": Pipeline([
            ('preprocessor', get_preprocessor()),
            ('regressor', RandomForestRegressor(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1))
        ]),
        "LightGBM": Pipeline([
            ('preprocessor', get_preprocessor()),
            ('regressor', lgb.LGBMRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, num_leaves=31, random_state=42, verbose=-1))
        ]),
        "XGBoost": Pipeline([
            ('preprocessor', get_preprocessor()),
            ('regressor', xgb.XGBRegressor(n_estimators=200, learning_rate=0.05, max_depth=6, random_state=42, n_jobs=-1))
        ])
    }

    cv_results = {}
    val_results = {}

    for name, pipeline in candidate_models.items():
        print(f"  * Training candidate: {name} ...")
        
        fold_rmses = []
        for train_idx, fold_val_idx in tscv.split(X_train):
            X_tr, y_tr = X_train.iloc[train_idx], y_train_log[train_idx]
            X_fold_val, y_fold_val = X_train.iloc[fold_val_idx], y_train_eur[fold_val_idx]
            
            pipeline.fit(X_tr, y_tr)
            fold_pred_log = pipeline.predict(X_fold_val)
            fold_pred_eur = np.expm1(fold_pred_log)
            fold_metrics = calculate_metrics(y_fold_val, fold_pred_eur)
            fold_rmses.append(fold_metrics['RMSE_EUR'])

        cv_results[name] = {
            "cv_mean_rmse_eur": float(np.mean(fold_rmses)),
            "cv_std_rmse_eur": float(np.std(fold_rmses))
        }

        pipeline.fit(X_train, y_train_log)
        val_pred_log = pipeline.predict(X_val)
        val_pred_eur = np.expm1(val_pred_log)
        val_metrics = calculate_metrics(y_val_eur, val_pred_eur)
        val_results[name] = val_metrics

    print("\n==========================================================================")
    print("        CANDIDATE MODEL VALIDATION PERFORMANCE COMPARISON                 ")
    print("==========================================================================")
    val_table = pd.DataFrame(val_results).T[['MAE_EUR', 'MedAE_EUR', 'RMSE_EUR', 'R2', 'WAPE', 'Log_RMSE']]
    print(val_table.to_string())

    best_model_name = val_table['WAPE'].idxmin()
    print(f"\n[OK] WINNING MODEL SELECTED: {best_model_name}")

    winning_pipeline = candidate_models[best_model_name]
    
    print(f"[*] Running ONE-TIME evaluation on untouched Out-Of-Time Test Set (2023-2026)...")
    test_pred_log = winning_pipeline.predict(X_test)
    test_pred_eur = np.expm1(test_pred_log)
    test_metrics = calculate_metrics(y_test_eur, test_pred_eur)

    print("\n==========================================================================")
    print("        FINAL UNTOUCHED TEST SET PERFORMANCE (WINNING MODEL)               ")
    print("==========================================================================")
    print(f"  Model Name       : {best_model_name}")
    print(f"  Test MAE         : EUR {test_metrics['MAE_EUR']:>12,.0f}")
    print(f"  Test Median AE   : EUR {test_metrics['MedAE_EUR']:>12,.0f}")
    print(f"  Test RMSE        : EUR {test_metrics['RMSE_EUR']:>12,.0f}")
    print(f"  Test R2 Score    : {test_metrics['R2']:>12.4f}")
    print(f"  Test WAPE Error  : {test_metrics['WAPE']*100:>12.2f}%")
    print(f"  Test Log RMSE    : {test_metrics['Log_RMSE']:>12.4f}")
    print("==========================================================================")

    joblib.dump(winning_pipeline, MODEL_SAVE_PATH)
    print(f"\n[+] Saved trained model artifact to: {MODEL_SAVE_PATH}")

    summary_data = {
        "best_model_name": best_model_name,
        "cv_results": cv_results,
        "validation_results": val_results,
        "test_results": test_metrics,
        "features": NUMERIC_FEATURES + CATEGORICAL_FEATURES + BOOLEAN_FEATURES
    }
    with open(METADATA_SAVE_PATH, 'w') as f:
        json.dump(summary_data, f, indent=2)

    return winning_pipeline, summary_data

if __name__ == "__main__":
    train_and_evaluate_candidates()
