from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.app.db.session import get_db
from backend.app.services.player_service import PlayerService
from backend.app.schemas.player_schemas import TransferResponse

router = APIRouter()

@router.get("/{player_id}/transfers", response_model=List[TransferResponse], summary="Get Player Transfer History", tags=["Transfers"])
def get_player_transfer_history(player_id: int, db: Session = Depends(get_db)):
    """Retrieves transfer event history and fee disclosures for a player."""
    player_data = PlayerService.get_player_detail(db, player_id)
    if not player_data:
        raise HTTPException(status_code=404, detail=f"Player with ID {player_id} not found.")
    return player_data['transfers']
