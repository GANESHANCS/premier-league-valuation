from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date

class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int
    total_pages: int

class ClubResponse(BaseModel):
    club_id: int
    name: str
    normalized_name: str

    class Config:
        from_attributes = True

class ValuationPoint(BaseModel):
    valuation_date: date
    market_value_eur: float
    freshness_status: str # Fresh, Recent, Stale, Unknown
    source: str

    class Config:
        from_attributes = True

class TransferResponse(BaseModel):
    transfer_date: date
    from_club_name: Optional[str] = None
    to_club_name: Optional[str] = None
    transfer_fee_eur: Optional[float] = None
    transfer_fee_status: str # disclosed, free_transfer, undisclosed

    class Config:
        from_attributes = True

class PerformanceSummary(BaseModel):
    apps_365d: int = 0
    goals_365d: int = 0
    assists_365d: int = 0
    minutes_365d: int = 0
    goals_per90_365d: float = 0.0
    assists_per90_365d: float = 0.0
    career_apps: int = 0
    career_goals: int = 0
    career_assists: int = 0
    career_minutes: int = 0

class PredictionResponse(BaseModel):
    predicted_fair_value_eur: float
    lower_bound_eur: float
    upper_bound_eur: float
    observed_market_value_eur: float
    valuation_gap_eur: float
    valuation_gap_pct: float
    model_version: str = "xgboost-v1"
    key_positive_factors: List[str] = []
    key_negative_factors: List[str] = []

class PlayerSummaryResponse(BaseModel):
    player_id: int
    name: str
    date_of_birth: Optional[date] = None
    age: Optional[float] = None
    position: Optional[str] = None
    sub_position: Optional[str] = None
    foot: Optional[str] = None
    height_in_cm: Optional[float] = None
    current_club_name: Optional[str] = None
    latest_observed_market_value_eur: Optional[float] = None
    latest_valuation_date: Optional[date] = None
    freshness_status: str = "Unknown"
    predicted_fair_value_eur: Optional[float] = None
    valuation_gap_eur: Optional[float] = None

    class Config:
        from_attributes = True

class PaginatedPlayersResponse(BaseModel):
    items: List[PlayerSummaryResponse]
    meta: PaginationMeta

class PlayerDetailResponse(BaseModel):
    player_id: int
    name: str
    date_of_birth: Optional[date] = None
    age: Optional[float] = None
    position: Optional[str] = None
    sub_position: Optional[str] = None
    foot: Optional[str] = None
    height_in_cm: Optional[float] = None
    height_imputed: bool = False
    country_of_citizenship: Optional[str] = None
    current_club: Optional[ClubResponse] = None
    latest_observed_market_value_eur: Optional[float] = None
    latest_valuation_date: Optional[date] = None
    freshness_status: str = "Unknown"
    valuation_history: List[ValuationPoint] = []
    transfers: List[TransferResponse] = []
    performance: PerformanceSummary
    prediction: Optional[PredictionResponse] = None

class ComparisonPlayer(BaseModel):
    player_id: int
    name: str
    age: Optional[float] = None
    position: Optional[str] = None
    club_name: Optional[str] = None
    observed_market_value_eur: Optional[float] = None
    predicted_fair_value_eur: Optional[float] = None
    valuation_gap_eur: Optional[float] = None
    apps_365d: int = 0
    goals_365d: int = 0
    assists_365d: int = 0
    minutes_365d: int = 0

class PlayerComparisonResponse(BaseModel):
    players: List[ComparisonPlayer]
