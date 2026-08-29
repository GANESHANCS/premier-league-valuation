from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import Dict, Any
from datetime import date

from backend.app.db.session import get_db
from backend.app.models.entities import Player, PlayerMarketValue, Transfer, PlayerPrediction, Club
from backend.app.core.config import settings
from backend.app.services.player_service import PlayerService

router = APIRouter()

@router.get("/summary", summary="Get Dashboard Summary Statistics", tags=["Dashboard"])
def get_dashboard_summary(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns high-level data intelligence summary metrics and top undervalued/overvalued players."""
    total_players = db.query(Player).count()
    total_valuations = db.query(PlayerMarketValue).count()
    total_transfers = db.query(Transfer).count()

    latest_val = db.query(PlayerMarketValue).order_by(desc(PlayerMarketValue.valuation_date)).first()
    latest_val_date = latest_val.valuation_date.strftime("%Y-%m-%d") if latest_val else "2026-06-12"

    # Top Undervalued players (Fair Value > Observed Value -> Highest positive gap_pct)
    undervalued_preds = db.query(PlayerPrediction).order_by(desc(PlayerPrediction.valuation_gap_pct)).limit(5).all()
    top_undervalued = []
    for pred in undervalued_preds:
        p_detail = PlayerService.get_player_detail(db, pred.player_id)
        if p_detail:
            top_undervalued.append({
                "player_id": p_detail['player_id'],
                "name": p_detail['name'],
                "club_name": p_detail['current_club']['name'] if p_detail.get('current_club') else None,
                "position": p_detail['position'],
                "observed_market_value_eur": pred.observed_market_value_eur,
                "predicted_fair_value_eur": pred.predicted_fair_value_eur,
                "valuation_gap_eur": pred.valuation_gap_eur,
                "valuation_gap_pct": pred.valuation_gap_pct,
                "signal": "UNDERVALUED"
            })

    # Top Overvalued players (Fair Value < Observed Value -> Lowest negative gap_pct)
    overvalued_preds = db.query(PlayerPrediction).order_by(asc(PlayerPrediction.valuation_gap_pct)).limit(5).all()
    top_overvalued = []
    for pred in overvalued_preds:
        p_detail = PlayerService.get_player_detail(db, pred.player_id)
        if p_detail:
            top_overvalued.append({
                "player_id": p_detail['player_id'],
                "name": p_detail['name'],
                "club_name": p_detail['current_club']['name'] if p_detail.get('current_club') else None,
                "position": p_detail['position'],
                "observed_market_value_eur": pred.observed_market_value_eur,
                "predicted_fair_value_eur": pred.predicted_fair_value_eur,
                "valuation_gap_eur": pred.valuation_gap_eur,
                "valuation_gap_pct": pred.valuation_gap_pct,
                "signal": "OVERVALUED"
            })

    return {
        "total_players": total_players,
        "total_valuations": total_valuations,
        "total_transfers": total_transfers,
        "latest_valuation_date": latest_val_date,
        "model_version": settings.MODEL_VERSION,
        "model_out_of_time_wape_pct": 14.86,
        "model_out_of_time_r2": 0.9542,
        "top_undervalued": top_undervalued,
        "top_overvalued": top_overvalued
    }
