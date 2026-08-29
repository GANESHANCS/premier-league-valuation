from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.db.session import get_db
from backend.app.services.player_service import PlayerService
from backend.app.schemas.player_schemas import PaginatedPlayersResponse, PlayerDetailResponse, PredictionResponse, PerformanceSummary

router = APIRouter()

@router.get("", response_model=PaginatedPlayersResponse, summary="List & Search Players", tags=["Players"])
def list_players(
    search: Optional[str] = Query(None, description="Search player by name"),
    position: Optional[str] = Query(None, description="Filter by main position (e.g. Defender, Forward)"),
    club_id: Optional[int] = Query(None, description="Filter by club ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Lists and searches Premier League players with pagination and filters."""
    result = PlayerService.get_players(
        db=db,
        search=search,
        position=position,
        club_id=club_id,
        page=page,
        page_size=page_size
    )
    return result

@router.get("/{player_id}", response_model=PlayerDetailResponse, summary="Get Player Detail Profile", tags=["Players"])
def get_player_detail(player_id: int, db: Session = Depends(get_db)):
    """Retrieves full biography, club info, market value history, transfer logs, performance metrics, and ML prediction for a specific player."""
    player_data = PlayerService.get_player_detail(db, player_id)
    if not player_data:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found.")
    return player_data

@router.get("/{player_id}/valuation", response_model=PredictionResponse, summary="Get Player Fair Value Prediction", tags=["Valuation"])
def get_player_valuation_prediction(player_id: int, db: Session = Depends(get_db)):
    """Generates ML fair value prediction, 80% prediction intervals, and explanatory factors for a player."""
    player_data = PlayerService.get_player_detail(db, player_id)
    if not player_data:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found.")
    if not player_data.get('prediction'):
        raise HTTPException(status_code=404, detail=f"Valuation prediction unavailable for player {player_id}.")
    return player_data['prediction']

@router.get("/{player_id}/performance", response_model=PerformanceSummary, summary="Get Player Performance Summary", tags=["Performance"])
def get_player_performance_summary(player_id: int, db: Session = Depends(get_db)):
    """Retrieves trailing 365-day and career match performance statistics for a player."""
    player_data = PlayerService.get_player_detail(db, player_id)
    if not player_data:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found.")
    return player_data['performance']
