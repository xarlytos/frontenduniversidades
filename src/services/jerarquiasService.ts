import { apiService } from './api';

export interface Jerarquia {
  id: string;
  nombre: string;
  descripcion?: string;
  nivel: number;
  superior_id?: string;
  subordinados?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateJerarquiaData {
  nombre: string;
  descripcion?: string;
  nivel: number;
  superior_id?: string;
}

export interface UpdateJerarquiaData {
  nombre?: string;
  descripcion?: string;
  nivel?: number;
  superior_id?: string;
}

class JerarquiasService {
  private baseUrl = '/jerarquias';

  // Obtener todas las jerarquías
  async getJerarquias(): Promise<Jerarquia[]> {
    const response = await apiService.get<Jerarquia[]>(this.baseUrl);
    return response.data;
  }

  // Obtener una jerarquía por ID
  async getJerarquia(id: string): Promise<Jerarquia> {
    const response = await apiService.get<Jerarquia>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Crear una nueva jerarquía
  async createJerarquia(data: CreateJerarquiaData): Promise<Jerarquia> {
    const response = await apiService.post<Jerarquia>(this.baseUrl, data);
    return response.data;
  }

  // Actualizar una jerarquía
  async updateJerarquia(id: string, data: UpdateJerarquiaData): Promise<Jerarquia> {
    const response = await apiService.put<Jerarquia>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Eliminar una jerarquía
  async deleteJerarquia(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  // Agregar subordinado a una jerarquía
  async agregarSubordinado(jerarquiaId: string, usuarioId: string): Promise<void> {
    await apiService.post(`${this.baseUrl}/${jerarquiaId}/subordinados`, { usuarioId });
  }

  // Remover subordinado de una jerarquía
  async removerSubordinado(jerarquiaId: string, usuarioId: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${jerarquiaId}/subordinados/${usuarioId}`);
  }
}

const jerarquiasService = new JerarquiasService();
export default jerarquiasService;