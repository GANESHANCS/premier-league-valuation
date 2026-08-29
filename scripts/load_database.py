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

def load_database():
    print("==========================================================================")
    print("      PL VALUEDGE - REPRODUCIBLE DATABASE SEEDING PIPELINE                ")
    print("==========================================================================")

    # 1. Create Tables
    print("[*] Creating Database Schema Tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
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
        print("[*] Seeding Clubs & Players from processed datasets...")
        players_df = pd.read_csv(PROCESSED_DIR / "clean_players.csv")
        players_df['date_of_birth'] = pd.to_datetime(players_df['date_of_birth'], errors='coerce')

        clubs_dict = {}
        for _, row in players_df.iterrows():
            club_id = row.get('current_club_id')
            club_name = row.get('current_club_name', 'Unknown')
            if pd.notna(club_id) and int(club_id) not in clubs_dict:
                c_obj = Club(
                    club_id=int(club_id),
                    name=str(club_name),
                    normalized_name=str(club_name).lower().strip(),
                    domestic_competition_id=str(row.get('current_club_domestic_competition_id', 'GB1'))
                )
                db.add(c_obj)
                clubs_dict[int(club_id)] = c_obj
        db.commit()

        player_objs = []
        for _, row in players_df.iterrows():
            dob = row['date_of_birth'].date() if pd.notna(row['date_of_birth']) else None
            cid = int(row['current_club_id']) if pd.notna(row['current_club_id']) and int(row['current_club_id']) in clubs_dict else None
            
            p_obj = Player(
                player_id=int(row['player_id']),
                name=str(row['name']),
                date_of_birth=dob,
                position=str(row['position']) if pd.notna(row['position']) else None,
                sub_position=str(row['sub_position']) if pd.notna(row['sub_position']) else None,
                foot=str(row['foot']) if pd.notna(row['foot']) else None,
                height_in_cm=float(row['height_in_cm']) if pd.notna(row['height_in_cm']) else None,
                height_imputed=bool(row.get('height_imputed', False)),
                country_of_citizenship=str(row.get('country_of_citizenship')) if pd.notna(row.get('country_of_citizenship')) else None,
                current_club_id=cid
            )
            player_objs.append(p_obj)

        db.bulk_save_objects(player_objs)
        db.commit()
        print(f"  [+] Seeded {len(clubs_dict):,d} Clubs & {len(player_objs):,d} Players.")

        # 3. Seed Player Market Values
        print("[*] Seeding Market Values...")
        vals_df = pd.read_csv(PROCESSED_DIR / "clean_valuations.csv")
        vals_df['date'] = pd.to_datetime(vals_df['date'], errors='coerce')
        valid_pids = set(p.player_id for p in player_objs)

        val_objs = []
        for _, row in vals_df.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids and pd.notna(row['date']) and pd.notna(row['market_value_in_eur']):
                v_obj = PlayerMarketValue(
                    player_id=p_id,
                    valuation_date=row['date'].date(),
                    market_value_eur=float(row['market_value_in_eur']),
                    source="dcaribou/transfermarkt-datasets (third-party open dataset)"
                )
                val_objs.append(v_obj)

        db.bulk_save_objects(val_objs)
        db.commit()
        print(f"  [+] Seeded {len(val_objs):,d} Market Valuation records.")

        # 4. Seed Transfers
        print("[*] Seeding Transfer History...")
        trs_df = pd.read_csv(PROCESSED_DIR / "clean_transfers.csv")
        trs_df['transfer_date'] = pd.to_datetime(trs_df['transfer_date'], errors='coerce')

        tr_objs = []
        for _, row in trs_df.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids and pd.notna(row['transfer_date']):
                fee = float(row['transfer_fee']) if pd.notna(row['transfer_fee']) else None
                status = str(row['transfer_fee_status']) if 'transfer_fee_status' in row else ('free_transfer' if fee == 0 else ('disclosed' if fee and fee > 0 else 'undisclosed'))
                
                t_obj = Transfer(
                    player_id=p_id,
                    transfer_date=row['transfer_date'].date(),
                    from_club_name=str(row.get('from_club_name')) if pd.notna(row.get('from_club_name')) else None,
                    to_club_name=str(row.get('to_club_name')) if pd.notna(row.get('to_club_name')) else None,
                    transfer_fee_eur=fee,
                    transfer_fee_status=status
                )
                tr_objs.append(t_obj)

        db.bulk_save_objects(tr_objs)
        db.commit()
        print(f"  [+] Seeded {len(tr_objs):,d} Transfer records.")

        # 5. Seed Appearances (Sample/Full)
        print("[*] Seeding Match Appearances...")
        apps_df = pd.read_csv(PROCESSED_DIR / "clean_appearances.csv")
        apps_df['date'] = pd.to_datetime(apps_df['date'], errors='coerce')

        app_objs = []
        for _, row in apps_df.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids and pd.notna(row['date']):
                a_obj = Appearance(
                    player_id=p_id,
                    game_id=int(row['game_id']),
                    date=row['date'].date(),
                    competition_id=str(row.get('competition_id', 'GB1')),
                    goals=int(row.get('goals', 0)),
                    assists=int(row.get('assists', 0)),
                    minutes_played=int(row.get('minutes_played', 0)),
                    yellow_cards=int(row.get('yellow_cards', 0)),
                    red_cards=int(row.get('red_cards', 0))
                )
                app_objs.append(a_obj)

        db.bulk_save_objects(app_objs)
        db.commit()
        print(f"  [+] Seeded {len(app_objs):,d} Appearance records.")

        # 6. Seed Predictions from ML Dataset
        print("[*] Precomputing ML Valuation Predictions for Database...")
        ml_df = pd.read_csv(ML_DIR / "ml_dataset_full.csv")
        ml_df['valuation_date'] = pd.to_datetime(ml_df['valuation_date'])

        # Group by player to get latest valuation row
        latest_ml = ml_df.sort_values('valuation_date').groupby('player_id').last().reset_index()

        pred_objs = []
        features = [c for c in ml_df.columns if c not in [
            'player_id', 'valuation_id', 'valuation_date', 'target_market_value_eur',
            'target_log_market_value', 'max_feature_info_date'
        ]]

        for _, row in latest_ml.iterrows():
            p_id = int(row['player_id'])
            if p_id in valid_pids:
                row_dict = row.to_dict()
                pred = valuation_service.predict_fair_value(row_dict)

                p_pred = PlayerPrediction(
                    player_id=p_id,
                    prediction_date=row['valuation_date'].date(),
                    model_version=pred['model_version'],
                    predicted_fair_value_eur=pred['predicted_fair_value_eur'],
                    lower_bound_eur=pred['lower_bound_eur'],
                    upper_bound_eur=pred['upper_bound_eur'],
                    observed_market_value_eur=pred['observed_market_value_eur'],
                    valuation_gap_eur=pred['valuation_gap_eur'],
                    valuation_gap_pct=pred['valuation_gap_pct']
                )
                pred_objs.append(p_pred)

        db.bulk_save_objects(pred_objs)
        db.commit()
        print(f"  [+] Precomputed and Seeded {len(pred_objs):,d} Player Predictions.")

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
