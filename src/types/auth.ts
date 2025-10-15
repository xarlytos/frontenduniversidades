export interface User {
  id: string;
  email: string;
  nombre: string;
  role: 'admin' | 'comercial';
  activo: boolean;
  fecha_creacion: string;
  ultimo_acceso?: string;
  // Nuevo campo para jerarquía
  jefe_id?: string; // ID del jefe si es comercial subordinado
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Permission {
  id: string;
  comercial_id: string;
  puede_ver_contactos_de: string[];
  puede_editar_contactos_de: string[];
  otorgado_por: string;
  fecha_creacion: string;
}

// Nuevo tipo para gestión de jerarquías
export interface ComercialHierarchy {
  id: string;
  jefe_id: string;
  comercial_id: string;
  asignado_por: string;
  fecha_asignacion: string;
  jefe_info?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
  comercial_info?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
}

export interface ContactWithOwner extends Contact {
  aportado_por: string;
  comercial_id: string;
  comercial_nombre: string;
}