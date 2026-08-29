from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.db.session import get_db
from backend.app.core.config import settings
from backend.app.services.valuation_service import valuation_service

router = APIRouter()

@router.get("/health", summary="Backend & ML System Health Check", tags=["Health"])
def health_check(response: Response, db: Session = Depends(get_db)):
    db_connected = False
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    model_loaded = valuation_service.pipeline is not None
    model_status = "loaded" if model_loaded else "unavailable"

    is_healthy = db_connected and model_loaded

    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "model_version": settings.MODEL_VERSION,
        "model": {
            "status": model_status,
            "version": settings.MODEL_VERSION
        }
    }

