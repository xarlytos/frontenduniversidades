import { apiService, ApiResponse } from './api';
import { Contact, ContactFilters } from '../types';

interface ContactsResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ContactResponse {
  contacto: Contact;
}

export class ContactsService {
  async getContacts(filters?: ContactFilters & { page?: number; limit?: number }): Promise<ApiResponse<ContactsResponse>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/contactos?${queryString}` : '/contactos';
    
    return apiService.get<ContactsResponse>(endpoint);
  }

  async getContact(id: string): Promise<ApiResponse<ContactResponse>> {
    return apiService.get<ContactResponse>(`/contactos/${id}`);
  }

  async getAllContacts(): Promise<ApiResponse<{ data: Contact[]; total: number; message: string }>> {
    try {
      const response = await apiService.get<Contact[]>('/contactos/todos');
      
      console.log('🔧 Procesando respuesta en contactsService:', response);
      
      // Mapear los datos del backend al formato esperado por el frontend
      if (response.success && Array.isArray(response.data)) {
        console.log('📋 Mapeando', response.data.length, 'contactos...');
        
        const mappedContacts = response.data.map((contact: any) => ({
          id: contact._id,
          nombre: contact.nombreCompleto || contact.nombre || '',
          telefono: contact.telefono,
          instagram: contact.instagram,
          universidad: contact.universidadId?.nombre || contact.universidad || '',
          universidadId: contact.universidadId?._id,
          titulacion: contact.titulacionId?.nombre || contact.titulacion || '',
          titulacionId: contact.titulacionId?._id,
          curso: contact.curso,
          año_nacimiento: contact.año_nacimiento,
          dia_libre: contact.diaLibre, // ← MAPEO CORREGIDO
          fecha_alta: contact.fechaAlta || contact.createdAt,
          comercial_id: contact.comercialId?._id,
          comercial_nombre: contact.comercialId?.nombre,
          comercial: contact.comercialId?.nombre,
          email: contact.email,
          aportado_por: contact.createdBy?.nombre || contact.comercialId?.nombre
        }));
        
        console.log('✅ Contactos mapeados:', mappedContacts.slice(0, 2));
        
        return {
          success: true,
          data: {
            data: mappedContacts,
            total: mappedContacts.length,
            message: 'Contactos obtenidos exitosamente'
          }
        };
      }
      
      console.log('❌ Respuesta no válida o datos no son array:', response);
      return {
        success: false,
        error: 'Formato de respuesta inválido',
        data: {
          data: [],
          total: 0,
          message: 'Error al procesar contactos'
        }
      };
    } catch (error) {
      console.error('💥 Error getting all contacts:', error);
      throw error;
    }
  }

  async createContact(contact: Omit<Contact, 'id' | 'fecha_alta'>): Promise<ApiResponse<ContactResponse>> {
    console.log('🔧 contactsService.createContact called with:', contact);
    console.log('🔧 Contact universidadId:', contact.universidadId);
    console.log('🔧 Contact titulacionId:', contact.titulacionId);
    
    try {
      // Usar los IDs directamente del formulario
      if (!contact.universidadId || !contact.titulacionId) {
        throw new Error('Universidad ID y Titulación ID son requeridos');
      }
      
      // Mapear los campos del frontend al backend
      const backendContact = {
        nombreCompleto: contact.nombre,
        telefono: contact.telefono,
        instagram: contact.instagram,
        universidadId: contact.universidadId,
        titulacionId: contact.titulacionId,
        curso: contact.curso,
        anioNacimiento: contact.año_nacimiento,
        comercialId: contact.comercial,
        diaLibre: contact.dia_libre // ← MAPEO AGREGADO
      };
      
      console.log('📤 Sending POST request with data:', backendContact);
      const response = await apiService.post<ContactResponse>('/contactos', backendContact);
      console.log('📥 POST response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error creating contact:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  async updateContact(id: string, contact: Partial<Contact>): Promise<ApiResponse<ContactResponse>> {
    // Mapear los campos del frontend al backend
    const backendContact: any = {};
    
    if (contact.nombre) backendContact.nombreCompleto = contact.nombre;
    if (contact.telefono) backendContact.telefono = contact.telefono;
    if (contact.instagram) backendContact.instagram = contact.instagram;
    if (contact.universidadId) backendContact.universidadId = contact.universidadId;
    if (contact.titulacionId) backendContact.titulacionId = contact.titulacionId;
    if (contact.curso) backendContact.curso = contact.curso;
    if (contact.año_nacimiento) backendContact.anioNacimiento = contact.año_nacimiento;
    if (contact.comercial) backendContact.comercialId = contact.comercial;
    if (contact.dia_libre !== undefined) backendContact.diaLibre = contact.dia_libre; // ← MAPEO AGREGADO
    
    return apiService.put<ContactResponse>(`/contactos/${id}`, backendContact);
  }

  async deleteContact(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/contactos/${id}`);
  }

  async assignCommercial(contactId: string, commercialId: string): Promise<ApiResponse<ContactResponse>> {
    return apiService.put<ContactResponse>(`/contactos/${contactId}/asignar`, {
      comercialId: commercialId
    });
  }

  async aumentarCursoTodos(): Promise<ApiResponse<{ message: string; data: { contactosModificados: number; contactosCoincidentes: number } }>> {
    return apiService.put<{ message: string; data: { contactosModificados: number; contactosCoincidentes: number } }>('/contactos/aumentar-curso', {});
  }

  async importarContactos(contactos: any[]): Promise<ApiResponse<{ message: string; data: { contactosCreados: number; errores: any[] } }>> {
    return apiService.post<{ message: string; data: { contactosCreados: number; errores: any[] } }>('/contactos/importar', { contactos });
  }

  async getContactosComercial(
    comercialId: string, 
    filters?: ContactFilters & { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<ApiResponse<ContactsResponse & { metadata: { comercialId: string; subordinados: string[]; comercialesIncluidos: string[] } }>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/contactos/comercial/${comercialId}?${queryString}` : `/contactos/comercial/${comercialId}`;
    
    return apiService.get<ContactsResponse & { metadata: { comercialId: string; subordinados: string[]; comercialesIncluidos: string[] } }>(endpoint);
  }
}

export const contactsService = new ContactsService();