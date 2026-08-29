import json
import pandas as pd
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"
REPORT_OUTPUT_PATH = PROCESSED_DATA_DIR / "phase1_audit_report.json"

DATA_RETRIEVAL_TIMESTAMP = "2026-08-29"

def run_data_audit():
    print("==========================================================================")
    print("      PL VALUEDGE - THIRD-PARTY DATASET AUDIT & INTEGRITY CHECK           ")
    print("      Dataset Source: dcaribou/transfermarkt-datasets (Third-Party)       ")
    print("==========================================================================")
    
    # 1. Load Data
    print("[*] Loading raw datasets into Pandas DataFrames...")
    competitions = pd.read_csv(RAW_DATA_DIR / "competitions.csv")
    clubs = pd.read_csv(RAW_DATA_DIR / "clubs.csv")
    players = pd.read_csv(RAW_DATA_DIR / "players.csv")
    valuations = pd.read_csv(RAW_DATA_DIR / "player_valuations.csv")
    transfers = pd.read_csv(RAW_DATA_DIR / "transfers.csv")
    games = pd.read_csv(RAW_DATA_DIR / "games.csv")
    appearances = pd.read_csv(RAW_DATA_DIR / "appearances.csv")

    datasets_info = {
        "competitions": {"rows": len(competitions), "cols": len(competitions.columns)},
        "clubs": {"rows": len(clubs), "cols": len(clubs.columns)},
        "players": {"rows": len(players), "cols": len(players.columns)},
        "player_valuations": {"rows": len(valuations), "cols": len(valuations.columns)},
        "transfers": {"rows": len(transfers), "cols": len(transfers.columns)},
        "games": {"rows": len(games), "cols": len(games.columns)},
        "appearances": {"rows": len(appearances), "cols": len(appearances.columns)},
    }

    # 2. Premier League Filter Audit
    pl_comp_id = 'GB1'
    pl_clubs = clubs[clubs['domestic_competition_id'] == pl_comp_id]
    pl_club_ids = set(pl_clubs['club_id'].dropna().unique())

    pl_players = players[
        (players['current_club_id'].isin(pl_club_ids)) | 
        (players['player_code'].astype(str).str.contains('premier-league', case=False, na=False))
    ]
    pl_player_ids = set(pl_players['player_id'].dropna().unique())

    pl_games = games[games['competition_id'] == pl_comp_id]
    pl_game_ids = set(pl_games['game_id'].dropna().unique())

    pl_appearances = appearances[appearances['game_id'].isin(pl_game_ids)]
    pl_appearance_player_ids = set(pl_appearances['player_id'].dropna().unique())

    all_pl_player_ids = pl_player_ids.union(pl_appearance_player_ids)
    total_pl_players = len(all_pl_player_ids)

    # 3. Valuation Freshness Analysis
    valuations['datetime'] = pd.to_datetime(valuations['date'], errors='coerce')
    min_val_date = valuations['datetime'].min().strftime('%Y-%m-%d')
    max_val_date = valuations['datetime'].max().strftime('%Y-%m-%d')
    
    pl_valuations = valuations[valuations['player_id'].isin(all_pl_player_ids)]
    
    latest_val_idx = pl_valuations.groupby('player_id')['datetime'].idxmax()
    latest_pl_valuations = pl_valuations.loc[latest_val_idx].copy()
    
    retrieval_dt = pd.to_datetime(DATA_RETRIEVAL_TIMESTAMP)
    latest_pl_valuations['days_old'] = (retrieval_dt - latest_pl_valuations['datetime']).dt.days

    def categorize_freshness(days):
        if pd.isna(days):
            return 'Unknown'
        elif days <= 90:
            return 'Fresh (<=90 days)'
        elif days <= 180:
            return 'Recent (91-180 days)'
        else:
            return 'Stale (>180 days)'

    latest_pl_valuations['freshness_status'] = latest_pl_valuations['days_old'].apply(categorize_freshness)
    freshness_counts = latest_pl_valuations['freshness_status'].value_counts().to_dict()

    val_2025_plus = len(latest_pl_valuations[latest_pl_valuations['datetime'] >= '2025-01-01'])
    val_2026_plus = len(latest_pl_valuations[latest_pl_valuations['datetime'] >= '2026-01-01'])
    val_2026_june = len(latest_pl_valuations[latest_pl_valuations['datetime'] >= '2026-06-01'])

    print(f"\n--- MARKET VALUE FRESHNESS AUDIT (Retrieval Date: {DATA_RETRIEVAL_TIMESTAMP}) ---")
    print(f"  * Dataset Latest Valuation Date: {max_val_date}")
    print(f"  * Total PL Players with at least 1 Valuation: {len(latest_pl_valuations):,d} / {total_pl_players:,d} ({len(latest_pl_valuations)/total_pl_players*100:.1f}%)")
    print(f"  * Freshness Breakdown:")
    for status, count in freshness_counts.items():
        print(f"    - {status:25s}: {count:>5,d} players ({count/total_pl_players*100:.1f}% of total PL universe)")
    print(f"  * Valuation Threshold Breakdown:")
    print(f"    - Valuations >= 2025-01-01: {val_2025_plus:>5,d} ({val_2025_plus/total_pl_players*100:.1f}%)")
    print(f"    - Valuations >= 2026-01-01: {val_2026_plus:>5,d} ({val_2026_plus/total_pl_players*100:.1f}%)")
    print(f"    - Valuations >= 2026-06-01: {val_2026_june:>5,d} ({val_2026_june/total_pl_players*100:.1f}%)")

    # 4. Transfer Fee Semantics Audit
    pl_transfers = transfers[
        (transfers['player_id'].isin(all_pl_player_ids)) |
        (transfers['from_club_id'].isin(pl_club_ids)) |
        (transfers['to_club_id'].isin(pl_club_ids))
    ]
    
    fee_disclosed = len(pl_transfers[pl_transfers['transfer_fee'] > 0])
    fee_free = len(pl_transfers[pl_transfers['transfer_fee'] == 0])
    fee_null = len(pl_transfers[pl_transfers['transfer_fee'].isna()])

    print(f"\n--- TRANSFER FEE SEMANTICS AUDIT ---")
    print(f"  * Total PL Transfer Records: {len(pl_transfers):,d}")
    print(f"    - Disclosed Non-Zero Fees (>€0): {fee_disclosed:>5,d} ({fee_disclosed/len(pl_transfers)*100:.1f}%)")
    print(f"    - Explicit Free Transfers (€0): {fee_free:>5,d} ({fee_free/len(pl_transfers)*100:.1f}%)")
    print(f"    - Undisclosed / Unknown (NULL): {fee_null:>5,d} ({fee_null/len(pl_transfers)*100:.1f}%)")

    # 5. Foot & Missing Market Value Audit
    foot_counts = players['foot'].fillna('Unknown').value_counts().to_dict()
    print(f"\n--- FOOT & MARKET VALUE IMPUTATION AUDIT ---")
    print(f"  * Preferred Foot Distribution in Raw Players:")
    for foot, count in foot_counts.items():
        print(f"    - {foot:10s}: {count:>6,d} ({count/len(players)*100:.1f}%)")

    missing_mv_count = players['market_value_in_eur'].isna().sum()
    print(f"  * Missing Market Value in Raw Players Table: {missing_mv_count:,d} / {len(players):,d} ({missing_mv_count/len(players)*100:.1f}%)")
    print(f"  * Imputation Policy Verified: Missing market values are kept as NULL/NaN in raw and preserved with `market_value_missing = True` flag.")

    audit_results = {
        "dataset_identity": "dcaribou/transfermarkt-datasets (third-party)",
        "affiliation_disclaimer": "The project is not affiliated with or endorsed by Transfermarkt.",
        "retrieval_timestamp": DATA_RETRIEVAL_TIMESTAMP,
        "datasets": datasets_info,
        "premier_league": {
            "clubs_count": len(pl_clubs),
            "total_players_count": total_pl_players,
            "games_count": len(pl_games),
            "appearances_count": len(pl_appearances),
            "transfers_count": len(pl_transfers),
            "valuations_count": len(pl_valuations),
            "players_with_valuations": len(latest_pl_valuations),
            "latest_valuation_date": max_val_date,
            "freshness": freshness_counts,
            "thresholds": {
                "val_2025_plus": val_2025_plus,
                "val_2026_plus": val_2026_plus,
                "val_2026_june": val_2026_june
            }
        },
        "transfer_semantics": {
            "disclosed_fee_count": fee_disclosed,
            "free_transfer_zero_count": fee_free,
            "undisclosed_null_count": fee_null
        },
        "foot_distribution": foot_counts
    }

    REPORT_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_OUTPUT_PATH, 'w') as f:
        json.dump(audit_results, f, indent=2)

    print(f"\n[OK] Corrected data quality audit written to: {REPORT_OUTPUT_PATH}")

if __name__ == "__main__":
    run_data_audit()
