import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc, asc
from datetime import datetime, date
from typing import Optional, List, Dict, Any

from backend.app.models.entities import Player, Club, PlayerMarketValue, Transfer, Appearance, PlayerPrediction
from backend.app.services.valuation_service import valuation_service

def calculate_age(dob: Optional[date], target_dt: Optional[date] = None) -> Optional[float]:
    if dob is None:
        return None
    if target_dt is None:
        target_dt = date.today()
    return round((target_dt - dob).days / 365.25, 2)

def calculate_freshness(val_date: Optional[date], current_dt: Optional[date] = None) -> str:
    if val_date is None:
        return "Unknown"
    if current_dt is None:
        current_dt = date(2026, 8, 29) # Pipeline retrieval anchor date
    
    days = (current_dt - val_date).days
    if days <= 90:
        return "Fresh"
    elif days <= 180:
        return "Recent"
    else:
        return "Stale"

class PlayerService:

    @staticmethod
    def get_players(
        db: Session,
        search: Optional[str] = None,
        position: Optional[str] = None,
        club_id: Optional[int] = None,
        sort_by: str = "market_value",
        order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        query = db.query(Player)

        # Filters
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(Player.name.ilike(search_pattern))

        if position:
            query = query.filter(Player.position.ilike(f"%{position.strip()}%"))

        if club_id:
            query = query.filter(Player.current_club_id == club_id)

        # Total count
        total = query.count()
        total_pages = max(1, (total + page_size - 1) // page_size)

        # Execute pagination
        offset = (page - 1) * page_size
        players = query.offset(offset).limit(page_size).all()

        items = []
        for p in players:
            # Latest observed valuation
            latest_val = db.query(PlayerMarketValue).filter(PlayerMarketValue.player_id == p.player_id).order_by(desc(PlayerMarketValue.valuation_date)).first()
            mv_eur = latest_val.market_value_eur if latest_val else None
            v_date = latest_val.valuation_date if latest_val else None
            freshness = calculate_freshness(v_date)

            # Latest saved prediction
            latest_pred = db.query(PlayerPrediction).filter(PlayerPrediction.player_id == p.player_id).order_by(desc(PlayerPrediction.prediction_date)).first()
            fair_val = latest_pred.predicted_fair_value_eur if latest_pred else None
            gap_eur = latest_pred.valuation_gap_eur if latest_pred else None

            club_name = p.current_club.name if p.current_club else None

            items.append({
                "player_id": p.player_id,
                "name": p.name,
                "date_of_birth": p.date_of_birth,
                "age": calculate_age(p.date_of_birth),
                "position": p.position,
                "sub_position": p.sub_position,
                "foot": p.foot,
                "height_in_cm": p.height_in_cm,
                "current_club_name": club_name,
                "latest_observed_market_value_eur": mv_eur,
                "latest_valuation_date": v_date,
                "freshness_status": freshness,
                "predicted_fair_value_eur": fair_val,
                "valuation_gap_eur": gap_eur
            })

        return {
            "items": items,
            "meta": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }

    @staticmethod
    def get_player_detail(db: Session, player_id: int) -> Optional[Dict[str, Any]]:
        p = db.query(Player).filter(Player.player_id == player_id).first()
        if not p:
            return None

        # Valuations history
        vals = db.query(PlayerMarketValue).filter(PlayerMarketValue.player_id == player_id).order_by(asc(PlayerMarketValue.valuation_date)).all()
        val_history = [{
            "valuation_date": v.valuation_date,
            "market_value_eur": v.market_value_eur,
            "freshness_status": calculate_freshness(v.valuation_date),
            "source": v.source
        } for v in vals]

        latest_val = vals[-1] if vals else None
        latest_mv = latest_val.market_value_eur if latest_val else None
        latest_date = latest_val.valuation_date if latest_val else None

        # Transfers history
        trs = db.query(Transfer).filter(Transfer.player_id == player_id).order_by(desc(Transfer.transfer_date)).all()
        tr_history = [{
            "transfer_date": t.transfer_date,
            "from_club_name": t.from_club_name,
            "to_club_name": t.to_club_name,
            "transfer_fee_eur": t.transfer_fee_eur,
            "transfer_fee_status": t.transfer_fee_status
        } for t in trs]

        # Performance summary
        apps = db.query(Appearance).filter(Appearance.player_id == player_id).all()
        career_apps = len(apps)
        career_goals = sum(a.goals for a in apps)
        career_assists = sum(a.assists for a in apps)
        career_mins = sum(a.minutes_played for a in apps)

        # Trailing 365d stats
        ref_dt = latest_date if latest_date else date(2026, 6, 12)
        start_365 = ref_dt - pd.Timedelta(days=365)
        apps_365 = [a for a in apps if a.date >= start_365 and a.date <= ref_dt]
        
        mins_365 = sum(a.minutes_played for a in apps_365)
        goals_365 = sum(a.goals for a in apps_365)
        assists_365 = sum(a.assists for a in apps_365)
        n_90s = max(mins_365 / 90.0, 0.1)

        perf_summary = {
            "apps_365d": len(apps_365),
            "goals_365d": goals_365,
            "assists_365d": assists_365,
            "minutes_365d": mins_365,
            "goals_per90_365d": round(goals_365 / n_90s, 4),
            "assists_per90_365d": round(assists_365 / n_90s, 4),
            "career_apps": career_apps,
            "career_goals": career_goals,
            "career_assists": career_assists,
            "career_minutes": career_mins
        }

        # Dynamic Prediction Generation
        feat_dict = {
            "player_id": player_id,
            "age_at_valuation": calculate_age(p.date_of_birth, ref_dt) or 25.0,
            "age_squared": (calculate_age(p.date_of_birth, ref_dt) or 25.0) ** 2,
            "height_in_cm": p.height_in_cm or 182.0,
            "height_imputed": p.height_imputed,
            "main_position": p.position or 'Midfielder',
            "sub_position": p.sub_position or 'Unknown',
            "foot": p.foot or 'Unknown',
            "apps_365d": len(apps_365),
            "starts_365d": int(sum(1 for a in apps_365 if a.minutes_played >= 45)),
            "minutes_365d": mins_365,
            "goals_365d": goals_365,
            "assists_365d": assists_365,
            "yellows_365d": sum(a.yellow_cards for a in apps_365),
            "reds_365d": sum(a.red_cards for a in apps_365),
            "goals_per90_365d": goals_365 / n_90s,
            "assists_per90_365d": assists_365 / n_90s,
            "contribs_per90_365d": (goals_365 + assists_365) / n_90s,
            "career_apps_prior": career_apps,
            "career_minutes_prior": career_mins,
            "career_goals_prior": career_goals,
            "career_assists_prior": career_assists,
            "prev_market_value_eur": latest_mv or 1e6,
            "days_since_prev_val": 0.0,
            "hist_max_value_eur": max((v.market_value_eur for v in vals), default=latest_mv or 1e6),
            "hist_min_value_eur": min((v.market_value_eur for v in vals), default=latest_mv or 1e6),
            "val_count_prior": len(vals),
            "val_change_365d": 0.0,
            "val_growth_ratio_365d": 1.0,
            "prev_transfer_fee_eur": trs[0].transfer_fee_eur if trs else None,
            "prev_transfer_fee_status": trs[0].transfer_fee_status if trs else "no_prior_transfer",
            "days_since_prev_transfer": (ref_dt - trs[0].transfer_date).days if trs else None,
            "total_prior_transfers": len(trs),
            "target_market_value_eur": latest_mv or 1e6
        }

        pred_res = valuation_service.predict_fair_value(feat_dict)

        club_res = {
            "club_id": p.current_club.club_id,
            "name": p.current_club.name,
            "normalized_name": p.current_club.normalized_name
        } if p.current_club else None

        return {
            "player_id": p.player_id,
            "name": p.name,
            "date_of_birth": p.date_of_birth,
            "age": calculate_age(p.date_of_birth),
            "position": p.position,
            "sub_position": p.sub_position,
            "foot": p.foot,
            "height_in_cm": p.height_in_cm,
            "height_imputed": p.height_imputed,
            "country_of_citizenship": p.country_of_citizenship,
            "current_club": club_res,
            "latest_observed_market_value_eur": latest_mv,
            "latest_valuation_date": latest_date,
            "freshness_status": calculate_freshness(latest_date),
            "valuation_history": val_history,
            "transfers": tr_history,
            "performance": perf_summary,
            "prediction": pred_res
        }
