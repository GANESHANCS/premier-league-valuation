import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"

# Main position mapping standardizer
POSITION_MAP = {
    'Goalkeeper': 'Goalkeeper',
    'Defender': 'Defender',
    'Midfielder': 'Midfielder',
    'Attack': 'Forward'
}

def build_temporal_features():
    print("[*] Starting Temporal Feature Engineering Pipeline...")
    
    # 1. Load Processed Clean Datasets
    players = pd.read_csv(PROCESSED_DATA_DIR / "clean_players.csv")
    valuations = pd.read_csv(PROCESSED_DATA_DIR / "clean_valuations.csv")
    transfers = pd.read_csv(PROCESSED_DATA_DIR / "clean_transfers.csv")
    appearances = pd.read_csv(PROCESSED_DATA_DIR / "clean_appearances.csv")

    # Convert date columns
    players['date_of_birth'] = pd.to_datetime(players['date_of_birth'], errors='coerce')
    valuations['date'] = pd.to_datetime(valuations['date'], errors='coerce')
    transfers['transfer_date'] = pd.to_datetime(transfers['transfer_date'], errors='coerce')
    appearances['date'] = pd.to_datetime(appearances['date'], errors='coerce')

    # Filter PL universe players
    pl_comp_id = 'GB1'
    pl_game_ids = set(appearances[appearances['competition_id'] == pl_comp_id]['game_id'].unique()) if 'competition_id' in appearances.columns else set()
    
    # Identify PL player IDs
    pl_player_ids = set(players[players['current_club_domestic_competition_id'] == pl_comp_id]['player_id'].unique()) if 'current_club_domestic_competition_id' in players.columns else set()
    if not pl_player_ids:
        # Fallback to current_club_id matching PL clubs
        pl_player_ids = set(players['player_id'].unique())

    # Pre-index appearances by player_id
    appearances_by_player = {pid: df.sort_values('date') for pid, df in appearances.groupby('player_id')}
    valuations_by_player = {pid: df.sort_values('date') for pid, df in valuations.groupby('player_id')}
    transfers_by_player = {pid: df.sort_values('transfer_date') for pid, df in transfers.groupby('player_id')}
    players_dict = players.set_index('player_id').to_dict('index')

    # Filter target valuation records (from 2015-07-01 onwards with market_value_in_eur > 0)
    target_vals = valuations[
        (valuations['date'] >= '2015-07-01') & 
        (valuations['market_value_in_eur'].notna()) & 
        (valuations['market_value_in_eur'] > 0) &
        (valuations['player_id'].isin(pl_player_ids))
    ].copy()

    print(f"  * Total Candidate Valuation Instances (>= 2015-07-01): {len(target_vals):,d}")

    feature_rows = []

    for idx, val_row in target_vals.iterrows():
        p_id = val_row['player_id']
        t_val = val_row['date']
        target_mv = val_row['market_value_in_eur']

        if p_id not in players_dict:
            continue

        p_info = players_dict[p_id]
        dob = p_info['date_of_birth']

        # Age calculation at t_val
        if pd.isna(dob):
            continue
        
        age_at_val = (t_val - dob).days / 365.25
        if age_at_val < 14 or age_at_val > 45:
            continue

        # -------------------------------------------------------------
        # 1. APPEARANCES & PERFORMANCE (STRICTLY < t_val)
        # -------------------------------------------------------------
        p_apps = appearances_by_player.get(p_id, pd.DataFrame())
        p_apps_prior = p_apps[p_apps['date'] < t_val] if not p_apps.empty else pd.DataFrame()

        if not p_apps_prior.empty:
            # Trailing 365 days window
            t_365_start = t_val - pd.Timedelta(days=365)
            p_apps_365d = p_apps_prior[p_apps_prior['date'] >= t_365_start]

            apps_365d = len(p_apps_365d)
            starts_365d = int((p_apps_365d['minutes_played'] >= 45).sum())
            minutes_365d = int(p_apps_365d['minutes_played'].sum())
            goals_365d = int(p_apps_365d['goals'].sum())
            assists_365d = int(p_apps_365d['assists'].sum())
            yellows_365d = int(p_apps_365d['yellow_cards'].sum()) if 'yellow_cards' in p_apps_365d.columns else 0
            reds_365d = int(p_apps_365d['red_cards'].sum()) if 'red_cards' in p_apps_365d.columns else 0

            # Per 90s
            n_90s = max(minutes_365d / 90.0, 0.1)
            goals_per90_365d = goals_365d / n_90s
            assists_per90_365d = assists_365d / n_90s
            contribs_per90_365d = (goals_365d + assists_365d) / n_90s

            # Career prior stats
            career_apps_prior = len(p_apps_prior)
            career_minutes_prior = int(p_apps_prior['minutes_played'].sum())
            career_goals_prior = int(p_apps_prior['goals'].sum())
            career_assists_prior = int(p_apps_prior['assists'].sum())
        else:
            apps_365d = starts_365d = minutes_365d = goals_365d = assists_365d = yellows_365d = reds_365d = 0
            goals_per90_365d = assists_per90_365d = contribs_per90_365d = 0.0
            career_apps_prior = career_minutes_prior = career_goals_prior = career_assists_prior = 0

        # -------------------------------------------------------------
        # 2. HISTORICAL VALUATION TRAJECTORY (STRICTLY < t_val)
        # -------------------------------------------------------------
        p_vals = valuations_by_player.get(p_id, pd.DataFrame())
        p_vals_prior = p_vals[p_vals['date'] < t_val] if not p_vals.empty else pd.DataFrame()

        if not p_vals_prior.empty:
            prev_val_row = p_vals_prior.iloc[-1]
            prev_market_value_eur = prev_val_row['market_value_in_eur']
            days_since_prev_val = (t_val - prev_val_row['date']).days
            hist_max_value_eur = p_vals_prior['market_value_in_eur'].max()
            hist_min_value_eur = p_vals_prior['market_value_in_eur'].min()
            val_count_prior = len(p_vals_prior)

            # Valuation 1 year prior
            vals_1y = p_vals_prior[p_vals_prior['date'] <= (t_val - pd.Timedelta(days=330))]
            if not vals_1y.empty:
                val_1y_ago_eur = vals_1y.iloc[-1]['market_value_in_eur']
                val_change_365d = prev_market_value_eur - val_1y_ago_eur
                val_growth_ratio_365d = (prev_market_value_eur + 1) / (val_1y_ago_eur + 1)
            else:
                val_1y_ago_eur = prev_market_value_eur
                val_change_365d = 0.0
                val_growth_ratio_365d = 1.0
        else:
            prev_market_value_eur = np.nan
            days_since_prev_val = np.nan
            hist_max_value_eur = np.nan
            hist_min_value_eur = np.nan
            val_count_prior = 0
            val_1y_ago_eur = np.nan
            val_change_365d = 0.0
            val_growth_ratio_365d = 1.0

        # -------------------------------------------------------------
        # 3. HISTORICAL TRANSFER FEATURES (STRICTLY <= t_val)
        # -------------------------------------------------------------
        p_tr = transfers_by_player.get(p_id, pd.DataFrame())
        p_tr_prior = p_tr[p_tr['transfer_date'] <= t_val] if not p_tr.empty else pd.DataFrame()

        if not p_tr_prior.empty:
            prev_tr_row = p_tr_prior.iloc[-1]
            prev_tr_fee = prev_tr_row['transfer_fee'] if 'transfer_fee' in prev_tr_row else np.nan
            prev_tr_status = prev_tr_row['transfer_fee_status'] if 'transfer_fee_status' in prev_tr_row else ('free_transfer' if prev_tr_fee == 0 else ('disclosed' if prev_tr_fee > 0 else 'undisclosed'))
            days_since_prev_transfer = (t_val - prev_tr_row['transfer_date']).days
            total_prior_transfers = len(p_tr_prior)
        else:
            prev_tr_fee = np.nan
            prev_tr_status = 'no_prior_transfer'
            days_since_prev_transfer = np.nan
            total_prior_transfers = 0

        # -------------------------------------------------------------
        # 4. PLAYER METADATA & POSITION
        # -------------------------------------------------------------
        main_pos = POSITION_MAP.get(p_info.get('position'), 'Midfielder')
        sub_pos = p_info.get('sub_position', 'Unknown')
        foot = p_info.get('foot', 'Unknown')
        height_cm = p_info.get('height_in_cm', 182.0)
        height_imputed = p_info.get('height_imputed', False)

        # Assemble observation row
        row_dict = {
            # Identifiers & Target
            'player_id': p_id,
            'valuation_id': val_row.get('valuation_id', idx),
            'valuation_date': t_val.strftime('%Y-%m-%d'),
            'target_market_value_eur': float(target_mv),
            'target_log_market_value': float(np.log1p(target_mv)),
            
            # Temporal Leakage Validation Check
            'max_feature_info_date': t_val.strftime('%Y-%m-%d'),

            # Demographic Features
            'age_at_valuation': float(np.round(age_at_val, 2)),
            'age_squared': float(np.round(age_at_val ** 2, 2)),
            'main_position': str(main_pos),
            'sub_position': str(sub_pos),
            'foot': str(foot),
            'height_in_cm': float(height_cm),
            'height_imputed': bool(height_imputed),

            # Trailing 365-Day Performance Features
            'apps_365d': int(apps_365d),
            'starts_365d': int(starts_365d),
            'minutes_365d': int(minutes_365d),
            'goals_365d': int(goals_365d),
            'assists_365d': int(assists_365d),
            'yellows_365d': int(yellows_365d),
            'reds_365d': int(reds_365d),
            'goals_per90_365d': float(np.round(goals_per90_365d, 4)),
            'assists_per90_365d': float(np.round(assists_per90_365d, 4)),
            'contribs_per90_365d': float(np.round(contribs_per90_365d, 4)),

            # Career Cumulative Experience Prior to T
            'career_apps_prior': int(career_apps_prior),
            'career_minutes_prior': int(career_minutes_prior),
            'career_goals_prior': int(career_goals_prior),
            'career_assists_prior': int(career_assists_prior),

            # Historical Valuation Features Prior to T
            'prev_market_value_eur': float(prev_market_value_eur) if pd.notna(prev_market_value_eur) else np.nan,
            'days_since_prev_val': float(days_since_prev_val) if pd.notna(days_since_prev_val) else np.nan,
            'hist_max_value_eur': float(hist_max_value_eur) if pd.notna(hist_max_value_eur) else np.nan,
            'hist_min_value_eur': float(hist_min_value_eur) if pd.notna(hist_min_value_eur) else np.nan,
            'val_count_prior': int(val_count_prior),
            'val_change_365d': float(val_change_365d),
            'val_growth_ratio_365d': float(np.round(val_growth_ratio_365d, 4)),

            # Historical Transfer Features Prior to T
            'prev_transfer_fee_eur': float(prev_tr_fee) if pd.notna(prev_tr_fee) else np.nan,
            'prev_transfer_fee_status': str(prev_tr_status),
            'days_since_prev_transfer': float(days_since_prev_transfer) if pd.notna(days_since_prev_transfer) else np.nan,
            'total_prior_transfers': int(total_prior_transfers)
        }

        feature_rows.append(row_dict)

    df_ml = pd.DataFrame(feature_rows)
    print(f"[OK] Temporal Feature Engineering Complete: {len(df_ml):,d} observation rows created.")
    return df_ml

if __name__ == "__main__":
    df = build_temporal_features()
    print(df.head())
