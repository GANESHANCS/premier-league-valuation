import os
from pathlib import Path
from typing import Any, List
from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "pl_valuation.db"
DEFAULT_MODEL_PATH = BASE_DIR / "data" / "processed" / "ml" / "best_model.joblib"

class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "Premier League Valuation Intelligence API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Environment mode
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database URL: defaults to SQLite for local reproducibility, supports PostgreSQL via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    
    # Model configuration
    MODEL_PATH: str = os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))
    MODEL_VERSION: str = "xgboost-v1"
    
    # CORS origins: parsed from comma-separated string or list
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            origins = [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            origins = [str(i).strip() for i in v if str(i).strip()]
        else:
            origins = ["http://localhost:3000", "http://localhost:5173"]
        
        env = os.getenv("ENVIRONMENT", "development").lower()
        if env == "production":
            origins = [o for o in origins if o != "*"]
        return origins

settings = Settings()

