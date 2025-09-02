import { apiService } from './api';

export interface Titulacion {
  id: string;
  nombre: string;
  codigo?: string;
  universidadId: string;
  tipo?: string;
  duracion?: number;
  creditos?: number;
  activa: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTitulacionData {
  nombre: string;
  codigo?: string;
  universidadId: string;
  tipo?: string;
  duracion?: number;
  creditos?: number;
  activa?: boolean;
}

export interface UpdateTitulacionData {
  nombre?: string;
  codigo?: string;
  universidadId?: string;
  tipo?: string;
  duracion?: number;
  creditos?: number;
  activa?: boolean;
}

export interface BuscarTitulacionParams {
  universidadId?: string;
  nombre?: string;
}

class TitulacionesService {
  private baseUrl = '/titulaciones';

  // Obtener todas las titulaciones
  async getTitulaciones(): Promise<Titulacion[]> {
    const response = await apiService.get<Titulacion[]>(this.baseUrl);
    return response.data;
  }

  // Obtener una titulación por ID
  async getTitulacion(id: string): Promise<Titulacion> {
    const response = await apiService.get<Titulacion>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Obtener titulaciones por universidad
  async getTitulacionesPorUniversidad(universidadId: string): Promise<Titulacion[]> {
    const response = await apiService.get<Titulacion[]>(`${this.baseUrl}/universidad/${universidadId}`);
    return response.data;
  }

  // Crear una nueva titulación
  async createTitulacion(data: CreateTitulacionData): Promise<Titulacion> {
    const response = await apiService.post<Titulacion>(this.baseUrl, data);
    return response.data;
  }

  // Actualizar una titulación
  async updateTitulacion(id: string, data: UpdateTitulacionData): Promise<Titulacion> {
    const response = await apiService.put<Titulacion>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Eliminar una titulación
  async deleteTitulacion(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  // Buscar titulación por nombre y universidad
  async buscarPorNombre(params: BuscarTitulacionParams): Promise<Titulacion[]> {
    const queryParams = new URLSearchParams();
    if (params.universidadId) {
      queryParams.append('universidadId', params.universidadId);
    }
    if (params.nombre) {
      queryParams.append('nombre', params.nombre);
    }
    
    const response = await apiService.get<Titulacion[]>(`${this.baseUrl}/buscar?${queryParams.toString()}`);
    return response.data;
  }
}

const titulacionesService = new TitulacionesService();
export default titulacionesService;