export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Club {
  club_id: number;
  name: string;
  normalized_name: string;
}

export interface ValuationPoint {
  valuation_date: string;
  market_value_eur: number;
  freshness_status: string;
  source: string;
}

export interface Transfer {
  id?: number;
  player_id?: number;
  player_name?: string;
  transfer_date: string;
  from_club_name: string | null;
  to_club_name: string | null;
  transfer_fee_eur: number | null;
  transfer_fee_status: 'disclosed' | 'free_transfer' | 'undisclosed' | string;
}

export interface PerformanceSummary {
  apps_365d: number;
  goals_365d: number;
  assists_365d: number;
  minutes_365d: number;
  goals_per90_365d: number;
  assists_per90_365d: number;
  career_apps: number;
  career_goals: number;
  career_assists: number;
  career_minutes: number;
}

export interface PredictionResponse {
  predicted_fair_value_eur: number;
  lower_bound_eur: number;
  upper_bound_eur: number;
  observed_market_value_eur: number;
  valuation_gap_eur: number;
  valuation_gap_pct: number;
  model_version: string;
  key_positive_factors: string[];
  key_negative_factors: string[];
}

export interface PlayerSummary {
  player_id: number;
  name: string;
  date_of_birth: string | null;
  age: number | null;
  position: string | null;
  sub_position: string | null;
  foot: string | null;
  height_in_cm: number | null;
  current_club_name: string | null;
  latest_observed_market_value_eur: number | null;
  latest_valuation_date: string | null;
  freshness_status: string;
  predicted_fair_value_eur: number | null;
  valuation_gap_eur: number | null;
}

export interface PaginatedPlayersResponse {
  items: PlayerSummary[];
  meta: PaginationMeta;
}

export interface PlayerDetail {
  player_id: number;
  name: string;
  date_of_birth: string | null;
  age: number | null;
  position: string | null;
  sub_position: string | null;
  foot: string | null;
  height_in_cm: number | null;
  height_imputed: boolean;
  country_of_citizenship: string | null;
  current_club: Club | null;
  latest_observed_market_value_eur: number | null;
  latest_valuation_date: string | null;
  freshness_status: string;
  valuation_history: ValuationPoint[];
  transfers: Transfer[];
  performance: PerformanceSummary;
  prediction: PredictionResponse | null;
}

export interface ComparisonPlayer {
  player_id: number;
  name: string;
  age: number | null;
  position: string | null;
  club_name: string | null;
  observed_market_value_eur: number | null;
  predicted_fair_value_eur: number | null;
  valuation_gap_eur: number | null;
  apps_365d: number;
  goals_365d: number;
  assists_365d: number;
  minutes_365d: number;
}

export interface DashboardSummary {
  total_players: number;
  total_valuations: number;
  total_transfers: number;
  latest_valuation_date: string;
  model_version: string;
  model_out_of_time_wape_pct: number;
  model_out_of_time_r2: number;
  top_undervalued: {
    player_id: number;
    name: string;
    club_name: string | null;
    position: string | null;
    observed_market_value_eur: number;
    predicted_fair_value_eur: number;
    valuation_gap_eur: number;
    valuation_gap_pct: number;
    signal: string;
  }[];
  top_overvalued: {
    player_id: number;
    name: string;
    club_name: string | null;
    position: string | null;
    observed_market_value_eur: number;
    predicted_fair_value_eur: number;
    valuation_gap_eur: number;
    valuation_gap_pct: number;
    signal: string;
  }[];
}

export interface ModelAnalytics {
  model_name: string;
  model_version: string;
  out_of_time_test_metrics: {
    MAE_EUR: number;
    MedAE_EUR: number;
    RMSE_EUR: number;
    R2: number;
    WAPE: number;
    Log_RMSE: number;
  };
  validation_metrics: {
    MAE_EUR: number;
    MedAE_EUR: number;
    RMSE_EUR: number;
    R2: number;
    WAPE: number;
    Log_RMSE: number;
  };
  feature_importances: {
    feature: string;
    importance_mean: number;
    importance_std: number;
  }[];
  uncertainty_quantile_residuals_log: {
    p10: number;
    p90: number;
  };
}
