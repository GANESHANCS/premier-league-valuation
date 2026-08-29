import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "pl_valuation.db"
DEFAULT_MODEL_PATH = BASE_DIR / "data" / "processed" / "ml" / "best_model.joblib"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Premier League Valuation Intelligence API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database URL: defaults to SQLite for local reproducibility, supports PostgreSQL via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    
    # Model configuration
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))
    MODEL_VERSION: str = "xgboost-v1"
    
    # CORS origins
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173", "*"]

    class Config:
        case_sensitive = True

settings = Settings()
