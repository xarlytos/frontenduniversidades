import { Request } from 'express';
import { IUsuario, RolUsuario } from '../models/Usuario';

// AuthRequest para controladores
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    rol: RolUsuario;
    _id?: string;
  };
}

// Re-exportar tipos de modelos
export { IUniversidad } from '../models/Universidad';
export { ITitulacion } from '../models/Titulacion';
export { IUsuario, RolUsuario, EstadoUsuario } from '../models/Usuario';

// Tipos para filtros y consultas
export interface ContactFilters {
  universidadId?: string;
  titulacionId?: string;
  curso?: number;
  comercialId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EstadisticasResponse {
  totalContactos: number;
  contactosPorUniversidad: Array<{
    universidad: string;
    total: number;
  }>;
  contactosPorTitulacion: Array<{
    universidad: string;
    titulacion: string;
    total: number;
    porCurso: Array<{
      curso: number;
      total: number;
    }>;
  }>;
}

// Tipos para autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: RolUsuario;
    permisos: string[];
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  rol: RolUsuario;
  iat?: number;
  exp?: number;
}