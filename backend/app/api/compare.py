from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.services.player_service import PlayerService
from backend.app.schemas.player_schemas import PlayerComparisonResponse, ComparisonPlayer

router = APIRouter()

@router.get("/compare", response_model=PlayerComparisonResponse, summary="Compare Multiple Players", tags=["Comparison"])
def compare_players(
    player_ids: str = Query(..., description="Comma-separated player IDs (e.g. ?player_ids=10,11 or ?player_ids=1001,1002)"),
    db: Session = Depends(get_db)
):
    """Compares key performance metrics, market values, and ML fair value predictions across multiple players."""
    try:
        parsed_ids = [int(x.strip()) for x in player_ids.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid player IDs format. Provide comma-separated integers.")

    if len(parsed_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 player IDs for comparison.")
    if len(parsed_ids) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 players can be compared per request.")

    compared_list = []
    for pid in parsed_ids:
        p_detail = PlayerService.get_player_detail(db, pid)
        if p_detail:
            pred = p_detail.get('prediction', {})
            perf = p_detail.get('performance', {})
            club_name = p_detail['current_club']['name'] if p_detail.get('current_club') else None

            compared_list.append(ComparisonPlayer(
                player_id=p_detail['player_id'],
                name=p_detail['name'],
                age=p_detail['age'],
                position=p_detail['position'],
                club_name=club_name,
                observed_market_value_eur=p_detail['latest_observed_market_value_eur'],
                predicted_fair_value_eur=pred.get('predicted_fair_value_eur'),
                valuation_gap_eur=pred.get('valuation_gap_eur'),
                apps_365d=perf.get('apps_365d', 0),
                goals_365d=perf.get('goals_365d', 0),
                assists_365d=perf.get('assists_365d', 0),
                minutes_365d=perf.get('minutes_365d', 0)
            ))

    return {"players": compared_list}
