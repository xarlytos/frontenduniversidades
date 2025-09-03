import { useState, useCallback, useEffect } from 'react';
import { Contact, ContactFilters } from '../types';
import { contactsService } from '../services/contactsService';

// Agregar parámetro para controlar cuándo cargar
export const useContacts = (shouldLoad: boolean = true) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar contactos desde la API usando getContacts (con filtros y paginación)
  const loadContacts = useCallback(async (filters?: ContactFilters & { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading contacts with filters:', filters);
      const response = await contactsService.getContacts(filters);
      
      if (response.success && response.data) {
        // Los contactos pueden estar en response.data directamente o en response.data.data
        const contactsData = Array.isArray(response.data) ? response.data : response.data.data;
        console.log('🔍 Raw API response data:', contactsData);
        console.log('📊 Total contacts received:', contactsData?.length || 0);
        
        if (contactsData && Array.isArray(contactsData)) {
          console.log('🔍 Processing contacts, initial count:', contactsData.length);
          
          // Verificar qué contactos se están filtrando
          const filteredOutContacts = contactsData.filter((contact: any) => {
            const hasId = contact._id !== undefined && contact._id !== null;
            const hasName = contact.nombreCompleto !== undefined && contact.nombreCompleto !== null && contact.nombreCompleto.toString().trim() !== '';
            const passes = hasId && hasName;
            if (!passes) {
              console.log('⚠️ Contact filtered out:', {
                id: contact._id,
                nombreCompleto: contact.nombreCompleto,
                hasId,
                hasName
              });
            }
            return !passes; // Invertido para ver los que NO pasan
          });
          
          console.log('📊 Contacts that will be filtered out:', filteredOutContacts.length);
          
          // Mapear los contactos manualmente ya que getContacts no los mapea
          const mappedContacts = contactsData
          .filter((contact: any) => {
            // Filter out contacts that don't have essential fields
            const hasId = contact._id !== undefined && contact._id !== null;
            const hasName = contact.nombreCompleto !== undefined && contact.nombreCompleto !== null && contact.nombreCompleto.toString().trim() !== '';
            return hasId && hasName;
          })
          .map((contact: any) => ({
            id: contact._id?.toString() || contact._id,
            nombre: contact.nombreCompleto?.toString() || '',
            telefono: contact.telefono || undefined,
            instagram: contact.instagram || undefined,
            universidad: contact.universidadId?.nombre || contact.universidad || 'Sin especificar',
            titulacion: contact.titulacionId?.nombre || contact.titulacion || 'Sin especificar',
            curso: contact.curso || 1,
            año_nacimiento: contact.anioNacimiento || contact.año_nacimiento || undefined,
            fecha_alta: contact.fechaAlta || contact.createdAt,
            comercial_id: contact.comercialId?._id || contact.comercialId || null,
            comercial_nombre: contact.comercialId?.nombre || 'Sin asignar',
            dia_libre: contact.diaLibre || undefined
          }));
        
          console.log('📝 Before setContacts - current state:', contacts.length);
          console.log('📋 ALL mapped contacts:', mappedContacts.map(c => ({ id: c.id, nombre: c.nombre })));
          setContacts(mappedContacts);
          console.log('✅ Contacts loaded from API:', mappedContacts.length);
          console.log('📝 After setContacts - new data set with:', mappedContacts.length, 'contacts');
        } else {
          console.log('❌ No valid contacts data found:', response.data);
          setContacts([]);
          setError('No se encontraron contactos válidos');
        }
      } else {
        console.log('❌ Invalid response format:', response);
        setError('Formato de respuesta inválido');
      }
    } catch (err: any) {
      console.error('❌ Error loading contacts:', err);
      setError(err.message || 'Error cargando contactos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar contactos de un comercial específico y sus subordinados
  const loadComercialContacts = useCallback(async (comercialId: string, filters?: ContactFilters & { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Loading comercial contacts for:', comercialId);
      const response = await contactsService.getContactosComercial(comercialId, filters);
      
      if (response.success && response.data) {
        // Los contactos están en response.data.data según la estructura del backend
        const contactsData = response.data.data || response.data;
        console.log('🔍 Raw comercial API response data:', contactsData);
        console.log('📊 Total comercial contacts received:', contactsData?.length || 0);
        console.log('📊 Full response structure:', response);
        console.log('📊 Response.data structure:', response.data);
        
        if (contactsData && Array.isArray(contactsData)) {
          // Mapear los contactos manualmente
          const mappedContacts = contactsData
          .filter((contact: any) => {
            const hasId = contact._id !== undefined && contact._id !== null;
            const hasName = contact.nombreCompleto !== undefined && contact.nombreCompleto !== null && contact.nombreCompleto.toString().trim() !== '';
            return hasId && hasName;
          })
          .map((contact: any) => ({
            id: contact._id?.toString() || contact._id,
            nombre: contact.nombreCompleto?.toString() || '',
            telefono: contact.telefono || undefined,
            instagram: contact.instagram || undefined,
            universidad: contact.universidadId?.nombre || contact.universidad || 'Sin especificar',
            titulacion: contact.titulacionId?.nombre || contact.titulacion || 'Sin especificar',
            curso: contact.curso || 1,
            año_nacimiento: contact.anioNacimiento || contact.año_nacimiento || undefined,
            fecha_alta: contact.fechaAlta || contact.createdAt,
            comercial_id: contact.comercialId?._id || contact.comercialId || null,
            comercial_nombre: contact.comercialId?.nombre || 'Sin asignar'
          }));
        
          setContacts(mappedContacts);
          console.log('✅ Comercial contacts loaded from API:', mappedContacts.length);
        } else {
          console.log('❌ No valid contacts data found:', response.data);
          setContacts([]);
          setError('No se encontraron contactos válidos');
        }
      } else {
        console.log('❌ Invalid comercial response format:', response);
        setError('Formato de respuesta inválido');
      }
    } catch (err: any) {
      console.error('❌ Error loading comercial contacts:', err);
      setError(err.message || 'Error cargando contactos del comercial');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar contactos al montar el componente
  // Modificar el useEffect para esperar a que shouldLoad sea true
  useEffect(() => {
    if (shouldLoad) {
      loadContacts();
    }
  }, [loadContacts, shouldLoad]);

  const addContact = useCallback(async (contactData: Omit<Contact, 'id' | 'fecha_alta'>, currentUser?: any) => {
    console.log('🚀 useContacts.addContact called with:', contactData, currentUser);
    console.log('🔍 Universidad value being sent:', contactData.universidad);
    console.log('🔍 Titulacion value being sent:', contactData.titulacion);
    try {
      setLoading(true);
      setError(null);
      
      console.log('📞 Calling contactsService.createContact...');
      const response = await contactsService.createContact(contactData);
      console.log('📥 Response from contactsService.createContact:', response);
      
      if (response.success && response.data) {
        console.log('✅ Contact created successfully');
        // Recargar la lista de contactos
        await loadContacts();
        return response.data.contacto;
      } else {
        console.log('⚠️ Response not successful or no data:', response);
      }
    } catch (err: any) {
      console.error('❌ Error creating contact:', err);
      setError(err.message || 'Error creando contacto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContacts]);

  const updateContact = useCallback(async (id: string, contactData: Omit<Contact, 'id' | 'fecha_alta'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await contactsService.updateContact(id, contactData);
      
      if (response.success) {
        console.log('✅ Contact updated successfully');
        // Recargar la lista de contactos
        await loadContacts();
      }
    } catch (err: any) {
      console.error('❌ Error updating contact:', err);
      setError(err.message || 'Error actualizando contacto');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadContacts]);

  const deleteContact = useCallback(async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
      try {
        console.log('🗑️ Starting delete for contact:', id);
        setLoading(true);
        setError(null);
        
        const response = await contactsService.deleteContact(id);
        console.log('📥 Delete response:', response);
        
        if (response.success) {
          console.log('✅ Contact deleted successfully, now reloading contacts...');
          // Recargar la lista de contactos
          await loadContacts();
          console.log('✅ Contacts reloaded after deletion');
          return true; // Retornar true para indicar éxito
        }
        return false;
      } catch (err: any) {
        console.error('❌ Error deleting contact:', err);
        setError(err.message || 'Error eliminando contacto');
        throw err;
      } finally {
        setLoading(false);
      }
    }
    return false; // Retornar false si se cancela
  }, [loadContacts]);

  const deleteMultipleContacts = useCallback(async (ids: string[]) => {
    const count = ids.length;
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${count} contacto${count > 1 ? 's' : ''}?`)) {
      try {
        setLoading(true);
        setError(null);
        
        // Eliminar contactos uno por uno
        for (const id of ids) {
          await contactsService.deleteContact(id);
        }
        
        console.log('✅ Multiple contacts deleted successfully');
        // Recargar la lista de contactos
        await loadContacts();
      } catch (err: any) {
        console.error('❌ Error deleting multiple contacts:', err);
        setError(err.message || 'Error eliminando contactos');
        throw err;
      } finally {
        setLoading(false);
      }
    }
  }, [loadContacts]);

  const checkDuplicates = useCallback(async (telefono?: string, instagram?: string, excludeId?: string) => {
    // Esta funcionalidad se puede implementar en el backend si es necesario
    return {
      telefono: false,
      instagram: false
    };
  }, []);

  const refreshContacts = useCallback(() => {
    return loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    loading,
    error,
    loadContacts,
    loadComercialContacts,
    addContact,
    updateContact,
    deleteContact,
    deleteMultipleContacts,
    checkDuplicates,
    refreshContacts
  };
}