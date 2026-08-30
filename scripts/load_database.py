import sys
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.entities import Club, Player, PlayerMarketValue, Transfer, Appearance, PlayerPrediction
from backend.app.services.valuation_service import valuation_service

PROCESSED_DIR = BASE_DIR / "data" / "processed"
ML_DIR = PROCESSED_DIR / "ml"

import sys
import pandas as pd
import numpy as np
from pathlib import Path
from sqlalchemy import text

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.entities import Club, Player, PlayerMarketValue, Transfer, Appearance, PlayerPrediction
from backend.app.services.valuation_service import valuation_service

PROCESSED_DIR = BASE_DIR / "data" / "processed"
ML_DIR = PROCESSED_DIR / "ml"

CHUNK_SIZE = 50000

def load_database():
    print("==========================================================================")
    print("      PL VALUEDGE - REPRODUCIBLE DATABASE SEEDING PIPELINE                ")
    print("==========================================================================")

    # 1. Create Tables
    print("[*] Creating Database Schema Tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Enable SQLite performance pragmas
        db.execute(text("PRAGMA synchronous = OFF;"))
        db.execute(text("PRAGMA journal_mode = MEMORY;"))

        # Clear existing records
        print("[*] Truncating existing database tables...")
        db.query(PlayerPrediction).delete()
        db.query(Appearance).delete()
        db.query(Transfer).delete()
        db.query(PlayerMarketValue).delete()
        db.query(Player).delete()
        db.query(Club).delete()
        db.commit()

        # 2. Seed Clubs & Players
        print("[*] Loading CSV Datasets & Resolving Club Entities...")
        players_df = pd.read_csv(PROCESSED_DIR / "clean_players.csv")
        players_df['date_of_birth'] = pd.to_datetime(players_df['date_of_birth'], errors='coerce')

        vals_df = pd.read_csv(PROCESSED_DIR / "clean_valuations.csv")
        vals_df['date'] = pd.to_datetime(vals_df['date'], errors='coerce')

        trs_df = pd.read_csv(PROCESSED_DIR / "clean_transfers.csv")
        trs_df['transfer_date'] = pd.to_datetime(trs_df['transfer_date'], errors='coerce')

        club_names = {}
        club_comps = {}

        for _, row in players_df.iterrows():
            cid = row.get('current_club_id')
            if pd.notna(cid):
                cid = int(cid)
                cname = row.get('current_club_name')
                comp = row.get('current_club_domestic_competition_id')
                if cid not in club_names and pd.notna(cname) and str(cname).strip() != '' and str(cname) != 'nan':
                    club_names[cid] = str(cname).strip()
                if cid not in club_comps and pd.notna(comp) and str(comp).strip() != '' and str(comp) != 'nan':
                    club_comps[cid] = str(comp).strip()

        for _, row in vals_df.iterrows():
            cid = row.get('current_club_id')
            if pd.notna(cid):
                cid = int(cid)
                cname = row.get('current_club_name')
                comp = row.get('player_club_domestic_competition_id')
                if cid not in club_names and pd.notna(cname) and str(cname).strip() != '' and str(cname) != 'nan':
                    club_names[cid] = str(cname).strip()
                if cid not in club_comps and pd.notna(comp) and str(comp).strip() != '' and str(comp) != 'nan':
                    club_comps[cid] = str(comp).strip()

        for _, row in trs_df.iterrows():
            fcid = row.get('from_club_id')
            fcname = row.get('from_club_name')
            if pd.notna(fcid):
                fcid = int(fcid)
                if fcid not in club_names and pd.notna(fcname) and str(fcname).strip() != '' and str(fcname) != 'nan':
                    club_names[fcid] = str(fcname).strip()
            tcid = row.get('to_club_id')
            tcname = row.get('to_club_name')
            if pd.notna(tcid):
                tcid = int(tcid)
                if tcid not in club_names and pd.notna(tcname) and str(tcname).strip() != '' and str(tcname) != 'nan':
                    club_names[tcid] = str(tcname).strip()

        clubs_dict = {}
        clubs_mappings = []
        for _, row in players_df.iterrows():
            club_id = row.get('current_club_id')
            if pd.notna(club_id) and int(club_id) not in clubs_dict:
                cid = int(club_id)
                clubs_dict[cid] = True
                name = club_names.get(cid, f"Club {cid}")
                comp = club_comps.get(cid, None)
                clubs_mappings.append({
                    "club_id": cid,
                    "name": name,
                    "normalized_name": name.lower().strip(),
                    "domestic_competition_id": comp
                })

        db.bulk_insert_mappings(Club, clubs_mappings)
        db.commit()

        player_mappings = []
        valid_pids = set()
        for _, row in players_df.iterrows():
            dob = row['date_of_birth'].date() if pd.notna(row['date_of_birth']) else None
            cid = int(row['current_club_id']) if pd.notna(row['current_club_id']) and int(row['current_club_id']) in clubs_dict else None
            p_id = int(row['player_id'])
            valid_pids.add(p_id)

            player_mappings.append({
                "player_id": p_id,
                "name": str(row['name']),
                "date_of_birth": dob,
                "position": str(row['position']) if pd.notna(row['position']) else None,
                "sub_position": str(row['sub_position']) if pd.notna(row['sub_position']) else None,
                "foot": str(row['foot']) if pd.notna(row['foot']) else None,
                "height_in_cm": float(row['height_in_cm']) if pd.notna(row['height_in_cm']) else None,
                "height_imputed": bool(row.get('height_imputed', False)),
                "country_of_citizenship": str(row.get('country_of_citizenship')) if pd.notna(row.get('country_of_citizenship')) else None,
                "current_club_id": cid
            })

        db.bulk_insert_mappings(Player, player_mappings)
        db.commit()
        print(f"  [+] Seeded {len(clubs_mappings):,d} Clubs & {len(player_mappings):,d} Players.")

        # 3. Seed Player Market Values
        print("[*] Seeding Market Values...")
        vals_df = pd.read_csv(PROCESSED_DIR / "clean_valuations.csv")
        vals_df['date'] = pd.to_datetime(vals_df['date'], errors='coerce')

        val_mappings = []
        for _, row in vals_df.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids and pd.notna(row['date']) and pd.notna(row['market_value_in_eur']):
                val_mappings.append({
                    "player_id": p_id,
                    "valuation_date": row['date'].date(),
                    "market_value_eur": float(row['market_value_in_eur']),
                    "source": "dcaribou/transfermarkt-datasets (third-party open dataset)"
                })

        for i in range(0, len(val_mappings), CHUNK_SIZE):
            db.bulk_insert_mappings(PlayerMarketValue, val_mappings[i:i+CHUNK_SIZE])
        db.commit()
        print(f"  [+] Seeded {len(val_mappings):,d} Market Valuation records.")

        # 4. Seed Transfers
        print("[*] Seeding Transfer History...")
        trs_df = pd.read_csv(PROCESSED_DIR / "clean_transfers.csv")
        trs_df['transfer_date'] = pd.to_datetime(trs_df['transfer_date'], errors='coerce')

        tr_mappings = []
        for _, row in trs_df.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids and pd.notna(row['transfer_date']):
                fee = float(row['transfer_fee']) if pd.notna(row['transfer_fee']) else None
                status = str(row['transfer_fee_status']) if 'transfer_fee_status' in row and pd.notna(row['transfer_fee_status']) else ('free_transfer' if fee == 0 else ('disclosed' if fee and fee > 0 else 'undisclosed'))
                
                from_id = int(row['from_club_id']) if 'from_club_id' in row and pd.notna(row['from_club_id']) else None
                to_id = int(row['to_club_id']) if 'to_club_id' in row and pd.notna(row['to_club_id']) else None

                tr_mappings.append({
                    "player_id": p_id,
                    "transfer_date": row['transfer_date'].date(),
                    "from_club_id": from_id,
                    "to_club_id": to_id,
                    "from_club_name": str(row.get('from_club_name')) if pd.notna(row.get('from_club_name')) else None,
                    "to_club_name": str(row.get('to_club_name')) if pd.notna(row.get('to_club_name')) else None,
                    "transfer_fee_eur": fee,
                    "transfer_fee_status": status
                })

        for i in range(0, len(tr_mappings), CHUNK_SIZE):
            db.bulk_insert_mappings(Transfer, tr_mappings[i:i+CHUNK_SIZE])
        db.commit()
        print(f"  [+] Seeded {len(tr_mappings):,d} Transfer records.")

        # 5. Seed Appearances
        print("[*] Seeding Match Appearances...")
        apps_df = pd.read_csv(PROCESSED_DIR / "clean_appearances.csv")
        apps_df['date'] = pd.to_datetime(apps_df['date'], errors='coerce')

        app_mappings = []
        for _, row in apps_df.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids and pd.notna(row['date']):
                app_mappings.append({
                    "player_id": p_id,
                    "game_id": int(row['game_id']),
                    "date": row['date'].date(),
                    "competition_id": str(row.get('competition_id', 'GB1')),
                    "goals": int(row.get('goals', 0)),
                    "assists": int(row.get('assists', 0)),
                    "minutes_played": int(row.get('minutes_played', 0)),
                    "yellow_cards": int(row.get('yellow_cards', 0)),
                    "red_cards": int(row.get('red_cards', 0))
                })

        print(f"  [->] Bulk inserting {len(app_mappings):,d} appearance records in chunks of {CHUNK_SIZE:,d}...")
        for i in range(0, len(app_mappings), CHUNK_SIZE):
            db.bulk_insert_mappings(Appearance, app_mappings[i:i+CHUNK_SIZE])
            if (i + CHUNK_SIZE) % 500000 < CHUNK_SIZE:
                print(f"      Inserted {min(i + CHUNK_SIZE, len(app_mappings)):,d} / {len(app_mappings):,d} appearances...")
        db.commit()
        print(f"  [+] Seeded {len(app_mappings):,d} Appearance records.")

        # 6. Seed Predictions from ML Dataset
        print("[*] Precomputing ML Valuation Predictions for Database...")
        ml_df = pd.read_csv(ML_DIR / "ml_dataset_full.csv")
        ml_df['valuation_date'] = pd.to_datetime(ml_df['valuation_date'])

        # Group by player to get latest valuation row
        latest_ml = ml_df.sort_values('valuation_date').groupby('player_id').last().reset_index()

        pred_mappings = []
        for _, row in latest_ml.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids:
                row_dict = row.to_dict()
                pred = valuation_service.predict_fair_value(row_dict)

                pred_mappings.append({
                    "player_id": p_id,
                    "prediction_date": row['valuation_date'].date(),
                    "model_version": pred['model_version'],
                    "predicted_fair_value_eur": pred['predicted_fair_value_eur'],
                    "lower_bound_eur": pred['lower_bound_eur'],
                    "upper_bound_eur": pred['upper_bound_eur'],
                    "observed_market_value_eur": pred['observed_market_value_eur'],
                    "valuation_gap_eur": pred['valuation_gap_eur'],
                    "valuation_gap_pct": pred['valuation_gap_pct']
                })

        db.bulk_insert_mappings(PlayerPrediction, pred_mappings)
        db.commit()
        print(f"  [+] Precomputed and Seeded {len(pred_mappings):,d} Player Predictions.")

        # Reset pragmas back to default
        db.execute(text("PRAGMA synchronous = FULL;"))
        db.execute(text("PRAGMA journal_mode = DELETE;"))

        print("\n==========================================================================")
        print("      [OK] DATABASE SEEDING COMPLETED SUCCESSFULLY                        ")
        print("==========================================================================")

    except Exception as e:
        db.rollback()
        print(f"[!] Error during database seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    load_database()
