import axios from 'axios';
import {
  PaginatedPlayersResponse,
  PlayerDetail,
  PredictionResponse,
  DashboardSummary,
  ModelAnalytics,
  Transfer,
  ComparisonPlayer
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
  return response.data;
};

export const fetchPlayers = async (params: {
  search?: string;
  position?: string;
  club_id?: number;
  page?: number;
  page_size?: number;
}): Promise<PaginatedPlayersResponse> => {
  const response = await apiClient.get<PaginatedPlayersResponse>('/players', { params });
  return response.data;
};

export const fetchPlayerDetail = async (playerId: number): Promise<PlayerDetail> => {
  const response = await apiClient.get<PlayerDetail>(`/players/${playerId}`);
  return response.data;
};

export const fetchPlayerValuation = async (playerId: number): Promise<PredictionResponse> => {
  const response = await apiClient.get<PredictionResponse>(`/players/${playerId}/valuation`);
  return response.data;
};

export const fetchGlobalTransfers = async (params: {
  search?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<{ items: Transfer[]; meta: any }> => {
  const response = await apiClient.get('/transfers', { params });
  return response.data;
};

export const fetchModelAnalytics = async (): Promise<ModelAnalytics> => {
  const response = await apiClient.get<ModelAnalytics>('/model/analytics');
  return response.data;
};

export const fetchPlayerComparison = async (playerIds: number[]): Promise<ComparisonPlayer[]> => {
  const idsParam = playerIds.join(',');
  const response = await apiClient.get<{ players: ComparisonPlayer[] }>(`/players/compare?player_ids=${idsParam}`);
  return response.data.players;
};
