export interface Contact {
  id: string;
  nombre: string;
  telefono?: string;
  instagram?: string;
  universidad: string;
  universidadId?: string;
  titulacion: string;
  titulacionId?: string;
  curso: number | null;
  año_nacimiento?: number;
  fecha_alta: string;
  comercial_id?: string;
  comercial_nombre?: string;
  comercial?: string;
  email?: string;
  aportado_por?: string;
}

export interface ContactFilters {
  universidad: string;
  titulacion: string;
  curso: string;
  aportado_por: string;
  consentimiento: string;
  search: string;
}

export interface UniversityStats {
  universidad: string;
  total: number;
  titulaciones: TitulationStats[];
}

export interface TitulationStats {
  titulacion: string;
  universidad: string;
  total: number;
  porCurso: Record<number, number>;
}