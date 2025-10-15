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
  dia_libre?: string;
}

export interface ContactFilters {
  universidad: string;
  titulacion: string;
  curso: string;
  aportado_por: string;
  consentimiento: string;
  search: string;
}