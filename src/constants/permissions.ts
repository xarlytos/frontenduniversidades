// Permisos disponibles en el sistema
// Esta lista debe mantenerse sincronizada con los permisos definidos en backend/src/scripts/seed.ts

export interface Permission {
  id: string;
  clave: string;
  descripcion: string;
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    id: '1',
    clave: 'VER_CONTACTOS',
    descripcion: 'Permite ver contactos'
  },
  {
    id: '2',
    clave: 'CREAR_CONTACTOS',
    descripcion: 'Permite crear nuevos contactos'
  },
  {
    id: '3',
    clave: 'EDITAR_CONTACTOS',
    descripcion: 'Permite editar contactos existentes'
  },
  {
    id: '4',
    clave: 'ELIMINAR_CONTACTOS',
    descripcion: 'Permite eliminar contactos'
  },
  {
    id: '5',
    clave: 'IMPORTAR_CONTACTOS',
    descripcion: 'Permite importar contactos desde Excel'
  },
  {
    id: '6',
    clave: 'EXPORTAR_CONTACTOS',
    descripcion: 'Permite exportar contactos'
  },
  {
    id: '7',
    clave: 'GESTIONAR_USUARIOS',
    descripcion: 'Permite gestionar usuarios del sistema'
  },
  {
    id: '8',
    clave: 'VER_ESTADISTICAS',
    descripcion: 'Permite ver estadísticas del sistema'
  },
  {
    id: '9',
    clave: 'GESTIONAR_UNIVERSIDADES',
    descripcion: 'Permite gestionar universidades y titulaciones'
  }
];