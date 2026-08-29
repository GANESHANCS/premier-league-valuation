import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
RAW_DATA_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"

def clean_datasets():
    print("[*] Running Data Cleaning & Provenance Pipeline...")
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Clean & Preserve Players Provenance
    players = pd.read_csv(RAW_DATA_DIR / "players.csv")
    
    # Dates
    players['date_of_birth'] = pd.to_datetime(players['date_of_birth'], errors='coerce')
    
    # Sub-position provenance
    players['sub_position_raw'] = players['sub_position']
    players['sub_position_imputed'] = players['sub_position'].isna()
    players['sub_position'] = players['sub_position'].fillna('Unknown')
    
    # Foot provenance (Fix: Missing foot is 'Unknown', NEVER 'both')
    players['foot_raw'] = players['foot']
    players['foot_imputed'] = players['foot'].isna()
    players['foot'] = players['foot'].fillna('Unknown')
    
    # Height provenance
    players['height_in_cm_raw'] = players['height_in_cm']
    players['height_imputed'] = players['height_in_cm'].isna()
    median_height_by_pos = players.groupby('position')['height_in_cm'].transform('median')
    global_median_height = players['height_in_cm'].median()
    players['height_in_cm'] = players['height_in_cm'].fillna(median_height_by_pos).fillna(global_median_height)
    
    # Market value provenance (Fix: Never force missing to 0)
    players['market_value_in_eur_raw'] = players['market_value_in_eur']
    players['market_value_missing'] = players['market_value_in_eur'].isna()
    
    players.to_csv(PROCESSED_DATA_DIR / "clean_players.csv", index=False)
    print(f"    [+] Saved clean_players.csv ({len(players):,d} records) with complete provenance flags.")

    # 2. Clean Valuations (Preserve untouched observed values)
    valuations = pd.read_csv(RAW_DATA_DIR / "player_valuations.csv")
    valuations['date'] = pd.to_datetime(valuations['date'], errors='coerce')
    
    # Do NOT drop or forge values; drop invalid dates/player_ids only
    valuations = valuations.dropna(subset=['player_id', 'date'])
    
    # Sort and remove duplicates keeping latest entry
    valuations = valuations.sort_values(['player_id', 'date']).drop_duplicates(subset=['player_id', 'date'], keep='last')
    
    valuations.to_csv(PROCESSED_DATA_DIR / "clean_valuations.csv", index=False)
    print(f"    [+] Saved clean_valuations.csv ({len(valuations):,d} records).")

    # 3. Clean Transfers (Preserve semantic difference between 0 fee and NULL undisclosed)
    transfers = pd.read_csv(RAW_DATA_DIR / "transfers.csv")
    transfers['transfer_date'] = pd.to_datetime(transfers['transfer_date'], errors='coerce')
    
    transfers['transfer_fee_raw'] = transfers['transfer_fee']
    
    def determine_fee_status(row):
        val = row['transfer_fee']
        if pd.isna(val):
            return 'undisclosed'
        elif val == 0:
            return 'free_transfer'
        elif val > 0:
            return 'disclosed'
        else:
            return 'unknown'

    transfers['transfer_fee_status'] = transfers.apply(determine_fee_status, axis=1)
    transfers.to_csv(PROCESSED_DATA_DIR / "clean_transfers.csv", index=False)
    print(f"    [+] Saved clean_transfers.csv ({len(transfers):,d} records) preserving free vs undisclosed transfer semantics.")

    # 4. Clean Appearances
    appearances = pd.read_csv(RAW_DATA_DIR / "appearances.csv")
    appearances['date'] = pd.to_datetime(appearances['date'], errors='coerce')
    appearances['minutes_played'] = appearances['minutes_played'].fillna(0).astype(int)
    appearances['goals'] = appearances['goals'].fillna(0).astype(int)
    appearances['assists'] = appearances['assists'].fillna(0).astype(int)
    appearances.to_csv(PROCESSED_DATA_DIR / "clean_appearances.csv", index=False)
    print(f"    [+] Saved clean_appearances.csv ({len(appearances):,d} records).")

    print("[OK] Data Cleaning & Provenance Pipeline Completed.")

if __name__ == "__main__":
    clean_datasets()
