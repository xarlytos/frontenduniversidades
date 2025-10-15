import { apiService } from './api';

export interface Titulacion {
  _id: string;
  nombre: string;
  codigo: string;
  tipo: string;
  duracion: number;
  creditos: number;
  modalidad: string;
}

export interface Universidad {
  id: string;
  nombre: string;
  codigo: string;
  ciudad?: string;
  pais?: string;
  tipo?: string;
  activa: boolean;
  created_at?: string;
  updated_at?: string;
  titulaciones?: Titulacion[];
}

export interface Curso {
  curso: string;
  totalAlumnos: number;
  alumnos: {
    _id: string;
    nombreCompleto: string;
    telefono?: string;
    instagram?: string;
    anioNacimiento?: number;
    fechaAlta: string;
    comercialId?: string;
  }[];
}

export interface TitulacionConEstadisticas extends Titulacion {
  totalAlumnos: number;
  cursos: Curso[];
}

export interface UniversidadConEstadisticas extends Universidad {
  totalAlumnos: number;
  totalTitulaciones: number;
  titulaciones: TitulacionConEstadisticas[];
}

export interface EstadisticasGenerales {
  totalUniversidades: number;
  totalTitulaciones: number;
  totalAlumnos: number;
}

export interface UniversidadesConEstadisticasResponse {
  success: boolean;
  estadisticasGenerales: EstadisticasGenerales;
  universidades: UniversidadConEstadisticas[];
}

export interface CreateUniversidadData {
  nombre: string;
  codigo: string;
  ciudad?: string;
  pais?: string;
  tipo?: string;
  activa?: boolean;
}

export interface UpdateUniversidadData {
  nombre?: string;
  codigo?: string;
  ciudad?: string;
  pais?: string;
  tipo?: string;
  estado?: 'activa' | 'inactiva'; // Cambiar de 'activa?: boolean' a 'estado'
}

class UniversidadesService {
  private baseUrl = '/universidades';

  // Obtener todas las universidades (público para usuarios autenticados)
  async getUniversidades(): Promise<Universidad[]> {
    const response = await apiService.get<{universidades: Universidad[], pagination: any}>(this.baseUrl);
    return response.universidades;
  }

  // Obtener una universidad por ID
  async getUniversidad(id: string): Promise<Universidad> {
    const response = await apiService.get<Universidad>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Crear una nueva universidad
  async createUniversidad(data: CreateUniversidadData): Promise<Universidad> {
    const response = await apiService.post<Universidad>(this.baseUrl, data);
    return response.data;
  }

  // Actualizar una universidad
  async updateUniversidad(id: string, data: UpdateUniversidadData): Promise<Universidad> {
    const response = await apiService.put<Universidad>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Eliminar una universidad
  async deleteUniversidad(id: string): Promise<void> {
    await apiService.delete(`${this.baseUrl}/${id}`);
  }

  // Buscar universidad por código
  async buscarPorCodigo(codigo: string): Promise<Universidad> {
    const response = await apiService.get<Universidad>(`${this.baseUrl}/codigo/${codigo}`);
    return response.data;
  }

  // Obtener universidades con estadísticas completas (titulaciones, cursos y alumnos)
  async getUniversidadesConEstadisticas(estado: string = 'activa'): Promise<UniversidadesConEstadisticasResponse> {
    const response = await apiService.get<UniversidadesConEstadisticasResponse>(
      `${this.baseUrl}/estadisticas?estado=${estado}`
    );
    return response;
  }
}

const universidadesService = new UniversidadesService();
export default universidadesService;