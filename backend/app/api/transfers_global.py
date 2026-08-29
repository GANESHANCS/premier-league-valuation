from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.models.entities import Transfer, Player

from datetime import date

router = APIRouter()

@router.get("", summary="List Global Historical Transfers Feed", tags=["Transfers"])
def list_global_transfers(
    search: Optional[str] = Query(None, description="Search player name or club"),
    status: Optional[str] = Query(None, description="Filter by fee status (disclosed, free_transfer, undisclosed)"),
    scope: str = Query("historical", description="Transfer timeline scope: 'historical' (<= dataset anchor date, default), 'future' (future agreed transfers/loan expiries), or 'all'"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Returns a paginated global feed of transfer events with timeline scope filtering."""
    query = db.query(Transfer, Player.name.label("player_name")).join(Player, Transfer.player_id == Player.player_id)

    # Date scope filtering
    ref_date = date(2026, 8, 29)
    if scope == "historical":
        query = query.filter(Transfer.transfer_date <= ref_date)
    elif scope == "future":
        query = query.filter(Transfer.transfer_date > ref_date)

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
    order_clause = desc(Transfer.transfer_date) if scope != "future" else Transfer.transfer_date
    records = query.order_by(order_clause).offset(offset).limit(page_size).all()

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
