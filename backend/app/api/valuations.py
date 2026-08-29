from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.services.player_service import PlayerService
from backend.app.schemas.player_schemas import ValuationPoint

router = APIRouter()

@router.get("/{player_id}/valuations", response_model=List[ValuationPoint], summary="Get Player Valuation History", tags=["Valuation"])
def get_player_valuation_history(player_id: int, db: Session = Depends(get_db)):
    """Retrieves full recorded market valuation timeline for a player."""
    player_data = PlayerService.get_player_detail(db, player_id)
    if not player_data:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found.")
    return player_data['valuation_history']
