from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.models.entities import Transfer, Player

router = APIRouter()

@router.get("", summary="List Global Historical Transfers Feed", tags=["Transfers"])
def list_global_transfers(
    search: Optional[str] = Query(None, description="Search player name or club"),
    status: Optional[str] = Query(None, description="Filter by fee status (disclosed, free_transfer, undisclosed)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns a paginated global feed of historical transfer events."""
    query = db.query(Transfer, Player.name.label("player_name")).join(Player, Transfer.player_id == Player.player_id)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            (Player.name.ilike(pattern)) |
            (Transfer.from_club_name.ilike(pattern)) |
            (Transfer.to_club_name.ilike(pattern))
        )

    if status:
        query = query.filter(Transfer.transfer_fee_status == status.strip().lower())

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)

    offset = (page - 1) * page_size
    records = query.order_by(desc(Transfer.transfer_date)).offset(offset).limit(page_size).all()

    items = []
    for tr, p_name in records:
        items.append({
            "id": tr.id,
            "player_id": tr.player_id,
            "player_name": p_name,
            "transfer_date": tr.transfer_date,
            "from_club_name": tr.from_club_name,
            "to_club_name": tr.to_club_name,
            "transfer_fee_eur": tr.transfer_fee_eur,
            "transfer_fee_status": tr.transfer_fee_status
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
