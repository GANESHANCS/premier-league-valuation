from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.db.session import Base

class Club(Base):
    __tablename__ = "clubs"

    club_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    normalized_name = Column(String(255), nullable=False, index=True)
    domestic_competition_id = Column(String(50), nullable=True)

    players = relationship("Player", back_populates="current_club")

class Player(Base):
    __tablename__ = "players"

    player_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    position = Column(String(100), nullable=True, index=True)
    sub_position = Column(String(100), nullable=True)
    foot = Column(String(50), nullable=True)
    height_in_cm = Column(Float, nullable=True)
    height_imputed = Column(Boolean, default=False)
    country_of_citizenship = Column(String(100), nullable=True)
    current_club_id = Column(Integer, ForeignKey("clubs.club_id"), nullable=True, index=True)

    current_club = relationship("Club", back_populates="players")
    market_values = relationship("PlayerMarketValue", back_populates="player", cascade="all, delete-orphan")
    transfers = relationship("Transfer", back_populates="player", cascade="all, delete-orphan")
    appearances = relationship("Appearance", back_populates="player", cascade="all, delete-orphan")
    predictions = relationship("PlayerPrediction", back_populates="player", cascade="all, delete-orphan")

class PlayerMarketValue(Base):
    __tablename__ = "player_market_values"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.player_id"), nullable=False, index=True)
    valuation_date = Column(Date, nullable=False, index=True)
    market_value_eur = Column(Float, nullable=False, index=True)
    source = Column(String(255), default="dcaribou/transfermarkt-datasets (third-party open dataset)")
    data_retrieved_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="market_values")

    __table_args__ = (
        Index("idx_player_val_date", "player_id", "valuation_date"),
    )

class Transfer(Base):
    __tablename__ = "transfers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.player_id"), nullable=False, index=True)
    transfer_date = Column(Date, nullable=False, index=True)
    from_club_id = Column(Integer, nullable=True)
    to_club_id = Column(Integer, nullable=True)
    from_club_name = Column(String(255), nullable=True)
    to_club_name = Column(String(255), nullable=True)
    transfer_fee_eur = Column(Float, nullable=True)
    transfer_fee_status = Column(String(50), nullable=False, default="undisclosed") # disclosed, free_transfer, undisclosed

    player = relationship("Player", back_populates="transfers")

    __table_args__ = (
        Index("idx_player_transfer_date", "player_id", "transfer_date"),
    )

class Appearance(Base):
    __tablename__ = "player_appearances"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.player_id"), nullable=False, index=True)
    game_id = Column(Integer, nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    competition_id = Column(String(50), nullable=True, index=True)
    goals = Column(Integer, default=0)
    assists = Column(Integer, default=0)
    minutes_played = Column(Integer, default=0)
    yellow_cards = Column(Integer, default=0)
    red_cards = Column(Integer, default=0)

    player = relationship("Player", back_populates="appearances")

    __table_args__ = (
        Index("idx_player_appearance_date", "player_id", "date"),
    )

class PlayerPrediction(Base):
    __tablename__ = "player_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(Integer, ForeignKey("players.player_id"), nullable=False, index=True)
    prediction_date = Column(Date, nullable=False, index=True)
    model_version = Column(String(50), nullable=False, default="xgboost-v1")
    predicted_fair_value_eur = Column(Float, nullable=False)
    lower_bound_eur = Column(Float, nullable=False)
    upper_bound_eur = Column(Float, nullable=False)
    observed_market_value_eur = Column(Float, nullable=False)
    valuation_gap_eur = Column(Float, nullable=False)
    valuation_gap_pct = Column(Float, nullable=False)

    player = relationship("Player", back_populates="predictions")

    __table_args__ = (
        Index("idx_player_pred_date", "player_id", "prediction_date"),
    )
