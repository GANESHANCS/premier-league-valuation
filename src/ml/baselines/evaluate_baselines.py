import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.linear_model import Ridge
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
ML_DATA_DIR = BASE_DIR / "data" / "processed" / "ml"

def calculate_metrics(y_true, y_pred):
    """Calculates MAE, RMSE, MedAE, R2, WAPE, and Log MAE/RMSE."""
    y_true = np.array(y_true)
    y_pred = np.maximum(np.array(y_pred), 0)
    
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    medae = np.median(np.abs(y_true - y_pred))
    
    # R2 score
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0.0
    
    # WAPE (Weighted Absolute Percentage Error)
    wape = np.sum(np.abs(y_true - y_pred)) / np.sum(y_true) if np.sum(y_true) > 0 else 0.0
    
    # Log space MAE & RMSE
    y_true_log = np.log1p(y_true)
    y_pred_log = np.log1p(y_pred)
    log_mae = np.mean(np.abs(y_true_log - y_pred_log))
    log_rmse = np.sqrt(np.mean((y_true_log - y_pred_log) ** 2))

    return {
        "MAE_EUR": float(mae),
        "RMSE_EUR": float(rmse),
        "MedAE_EUR": float(medae),
        "R2": float(r2),
        "WAPE": float(wape),
        "Log_MAE": float(log_mae),
        "Log_RMSE": float(log_rmse)
    }

def evaluate_baselines():
    print("[*] Evaluating Baseline Valuation Models...")
    
    train_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_train.csv")
    val_df = pd.read_csv(ML_DATA_DIR / "ml_dataset_val.csv")
    
    y_train = train_df['target_market_value_eur'].values
    y_val = val_df['target_market_value_eur'].values
    
    global_median_val = np.median(y_train)
    results = {}

    # 1. Baseline A: Previous Market Value
    pred_val_a = val_df['prev_market_value_eur'].fillna(global_median_val).values
    results['Baseline_A_Prev_Market_Value'] = calculate_metrics(y_val, pred_val_a)

    # 2. Baseline B: Historical Maximum Market Value
    pred_val_b = val_df['hist_max_value_eur'].fillna(global_median_val).values
    results['Baseline_B_Hist_Max_Value'] = calculate_metrics(y_val, pred_val_b)

    # 3. Baseline C: Age & Position Simple Ridge Baseline
    X_train_c = pd.get_dummies(train_df[['age_at_valuation', 'age_squared', 'main_position']], drop_first=True)
    X_val_c = pd.get_dummies(val_df[['age_at_valuation', 'age_squared', 'main_position']], drop_first=True)
    X_train_c, X_val_c = X_train_c.align(X_val_c, join='left', axis=1, fill_value=0)
    
    model_c = Ridge(alpha=10.0)
    model_c.fit(X_train_c, np.log1p(y_train))
    pred_log_c = model_c.predict(X_val_c)
    pred_val_c = np.expm1(pred_log_c)
    results['Baseline_C_Age_Position_Ridge'] = calculate_metrics(y_val, pred_val_c)

    # 4. Baseline D: Position x Age Bracket Median
    train_df['age_group'] = pd.cut(train_df['age_at_valuation'], bins=[0, 21, 25, 29, 100], labels=['<21', '21-25', '26-29', '30+'])
    val_df['age_group'] = pd.cut(val_df['age_at_valuation'], bins=[0, 21, 25, 29, 100], labels=['<21', '21-25', '26-29', '30+'])
    
    group_medians = train_df.groupby(['main_position', 'age_group'])['target_market_value_eur'].median().to_dict()
    
    pred_val_d = val_df.apply(
        lambda r: group_medians.get((r['main_position'], r['age_group']), global_median_val), axis=1
    ).values
    results['Baseline_D_Grouped_Median'] = calculate_metrics(y_val, pred_val_d)

    print("\n--- BASELINE VALIDATION PERFORMANCE TABLE ---")
    df_res = pd.DataFrame(results).T[['MAE_EUR', 'MedAE_EUR', 'RMSE_EUR', 'R2', 'WAPE', 'Log_RMSE']]
    print(df_res.to_string())

    return results

if __name__ == "__main__":
    evaluate_baselines()
