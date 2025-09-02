import { apiService } from './api';

export class MappingService {
  async getUniversidadId(codigo: string): Promise<string> {
    console.log('🔍 MappingService.getUniversidadId called with codigo:', codigo);
    console.log('🔍 Tipo de codigo:', typeof codigo);
    console.log('🔍 URL que se va a llamar:', `/universidades/codigo/${codigo}`);
    try {
      const response = await apiService.get(`/universidades/codigo/${codigo}`);
      console.log('✅ Universidad encontrada:', response.data);
      return response.data._id;
    } catch (error) {
      console.error('❌ Error en getUniversidadId:', error);
      throw new Error(`Universidad no encontrada: ${codigo}`);
    }
  }
  
  async getTitulacionId(universidadId: string, nombre: string): Promise<string> {
    console.log('🔍 MappingService.getTitulacionId called with:', { universidadId, nombre });
    console.log('🔍 URL que se va a llamar:', `/titulaciones/buscar?universidadId=${universidadId}&nombre=${encodeURIComponent(nombre)}`);
    try {
      const response = await apiService.get(`/titulaciones/buscar?universidadId=${universidadId}&nombre=${encodeURIComponent(nombre)}`);
      console.log('✅ Titulación encontrada:', response.data.data);
      return response.data.data._id;
    } catch (error) {
      console.error('❌ Error en getTitulacionId:', error);
      throw new Error(`Titulación no encontrada: ${nombre}`);
    }
  }
}

export const mappingService = new MappingService();