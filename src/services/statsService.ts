import { apiService, ApiResponse } from './api';

interface StatsResponse {
  total: number;
  porUniversidad?: Record<string, number>;
  porTitulacion?: Record<string, number>;
  porComercial?: Record<string, number>;
}

export class StatsService {
  async getTotalContacts(): Promise<ApiResponse<StatsResponse>> {
    return apiService.get<StatsResponse>('/estadisticas/contactos');
  }

  async getContactsByUniversity(): Promise<ApiResponse<StatsResponse>> {
    return apiService.get<StatsResponse>('/estadisticas/contactos/universidades');
  }

  async getContactsByDegree(): Promise<ApiResponse<StatsResponse>> {
    return apiService.get<StatsResponse>('/estadisticas/contactos/titulaciones');
  }
}

export const statsService = new StatsService();