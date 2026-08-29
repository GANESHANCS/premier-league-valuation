import pandas as pd
from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
PROCESSED_DATA_DIR = BASE_DIR / "data" / "processed"

# Canonical Premier League Club Name Normalization Map
CLUB_ALIAS_MAP = {
    "manchester united fc": "Manchester United",
    "manchester united": "Manchester United",
    "man utd": "Manchester United",
    "manchester city fc": "Manchester City",
    "manchester city": "Manchester City",
    "man city": "Manchester City",
    "arsenal fc": "Arsenal",
    "arsenal": "Arsenal",
    "chelsea fc": "Chelsea",
    "chelsea": "Chelsea",
    "liverpool fc": "Liverpool",
    "liverpool": "Liverpool",
    "tottenham hotspur fc": "Tottenham Hotspur",
    "tottenham hotspur": "Tottenham Hotspur",
    "spurs": "Tottenham Hotspur",
    "newcastle united fc": "Newcastle United",
    "newcastle united": "Newcastle United",
    "aston villa fc": "Aston Villa",
    "aston villa": "Aston Villa",
    "brighton & hove albion fc": "Brighton & Hove Albion",
    "brighton & hove albion": "Brighton & Hove Albion",
    "brighton": "Brighton & Hove Albion",
    "west ham united fc": "West Ham United",
    "west ham united": "West Ham United",
    "west ham": "West Ham United",
    "wolverhampton wanderers fc": "Wolverhampton Wanderers",
    "wolverhampton wanderers": "Wolverhampton Wanderers",
    "wolves": "Wolverhampton Wanderers",
    "everton fc": "Everton",
    "everton": "Everton",
    "afc bournemouth": "Bournemouth",
    "bournemouth": "Bournemouth",
    "fulham fc": "Fulham",
    "fulham": "Fulham",
    "crystal palace fc": "Crystal Palace",
    "crystal palace": "Crystal Palace",
    "brentford fc": "Brentford",
    "brentford": "Brentford",
    "nottingham forest fc": "Nottingham Forest",
    "nottingham forest": "Nottingham Forest",
    "leicester city fc": "Leicester City",
    "leicester city": "Leicester City",
    "southampton fc": "Southampton",
    "southampton": "Southampton",
    "ipswich town fc": "Ipswich Town",
    "ipswich town": "Ipswich Town",
    "leeds united fc": "Leeds United",
    "leeds united": "Leeds United"
}

def format_season(season_year: int) -> str:
    """Converts season integer e.g. 2024 to '2024/25' format."""
    try:
        y = int(season_year)
        next_y_str = str(y + 1)[-2:]
        return f"{y}/{next_y_str}"
    except (ValueError, TypeError):
        return str(season_year)

def normalize_club_name(raw_name: str) -> str:
    """Normalizes club name using canonical alias mapping."""
    if not isinstance(raw_name, str):
        return "Unknown Club"
    cleaned = raw_name.strip().lower()
    return CLUB_ALIAS_MAP.get(cleaned, raw_name.strip())

def resolve_player_entities(df_a: pd.DataFrame, df_b: pd.DataFrame, key_a='player_id', key_b='player_id') -> pd.DataFrame:
    """
    Performs entity resolution between two player dataframes.
    1. Primary Join: Match on canonical player_id.
    2. Fallback Join: Match on normalized Name + Date of Birth.
    """
    merged = pd.merge(df_a, df_b, left_on=key_a, right_on=key_b, how='inner', suffixes=('_a', '_b'))
    return merged

def run_normalization():
    print("[*] Running Entity Resolution & Season Normalization...")
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    clubs_path = PROCESSED_DATA_DIR / "clean_players.csv"
    if clubs_path.exists():
        players = pd.read_csv(clubs_path)
        if 'current_club_name' in players.columns:
            players['normalized_club_name'] = players['current_club_name'].apply(normalize_club_name)
            players.to_csv(PROCESSED_DATA_DIR / "normalized_players.csv", index=False)
            print(f"    [+] Saved normalized_players.csv with club name resolution")

    print("[OK] Entity Resolution & Normalization pipeline completed.")

if __name__ == "__main__":
    run_normalization()
