import React, { useState, useEffect } from 'react';
import { Search, Eye, User, GraduationCap } from 'lucide-react';
import { Contact } from '../types';
import { contactsService } from '../services/contactsService';
import { useAuth } from '../hooks/useAuth';

export default function ContactosCompleta() {
  const { hasPermission } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  // Verificar permisos al cargar el componente
  useEffect(() => {
    const checkPermissions = async () => {
      const canView = await hasPermission('view');
      if (!canView) {
        setError('No tienes permisos para ver esta página');
        setLoading(false);
        return;
      }
      loadContacts();
    };
    
    checkPermissions();
  }, [hasPermission]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Iniciando carga de contactos...');
      const response = await contactsService.getAllContacts();
      console.log('📡 Respuesta completa de la API:', response);
      
      if (response.success && response.data) {
        console.log('✅ Datos recibidos exitosamente:');
        console.log('  - response.data:', response.data);
        console.log('  - response.data.data:', response.data.data);
        console.log('  - Número de contactos:', response.data.data?.length || 0);
        console.log('  - Total reportado:', response.data.total);
        
        setContacts(response.data.data || []);
        setFilteredContacts(response.data.data || []);
        setTotalContacts(response.data.total || 0);
        
        console.log('📊 Estado actualizado:');
        console.log('  - contacts length:', response.data.data?.length || 0);
        console.log('  - totalContacts:', response.data.total || 0);
      } else {
        console.log('❌ Error en la respuesta:', {
          success: response.success,
          data: response.data,
          error: response.error
        });
        setError('Error al cargar los contactos');
      }
    } catch (err) {
      console.error('💥 Error loading contacts:', err);
      setError('Error al cargar los contactos');
    } finally {
      setLoading(false);
      console.log('🏁 Carga de contactos finalizada');
    }
  };

  // Filtrar contactos localmente
  useEffect(() => {
    console.log('🔍 Aplicando filtros:');
    console.log('  - searchTerm:', searchTerm);
    console.log('  - contacts length:', contacts.length);
    
    if (!searchTerm) {
      console.log('  - Sin término de búsqueda, mostrando todos los contactos');
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.telefono?.includes(searchTerm) ||
        contact.universidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.titulacion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('  - Contactos filtrados:', filtered.length);
      console.log('  - Primeros 3 contactos filtrados:', filtered.slice(0, 3));
      setFilteredContacts(filtered);
    }
  }, [contacts, searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600">
              <h3 className="text-lg font-medium">Error</h3>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contactos Completa</h1>
        <p className="text-gray-600 mt-1">
          Vista completa de todos los contactos ({totalContacts} total, {filteredContacts.length} mostrados)
        </p>
      </div>

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Búsqueda</h3>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
        
        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar contactos
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, teléfono, universidad o titulación..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando contactos...</span>
        </div>
      )}

      {/* Contactos Grid */}
      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{contact.nombre}</h3>
                      <p className="text-sm text-gray-500">{contact.universidad}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {contact.titulacion && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      {contact.titulacion}
                      {contact.curso && ` - ${contact.curso}º`}
                    </div>
                  )}
                </div>
                
                {(contact.comercial_nombre || contact.comercial) && (
  <div className="mt-4 pt-4 border-t border-gray-100">
    <p className="text-xs text-gray-500">
      Comercial: {contact.comercial_nombre || contact.comercial}
    </p>
  </div>
)}
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredContacts.length === 0 && !loading && (
            <div className="text-center py-12">
              <Eye className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No se encontraron contactos' : 'No hay contactos'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? `No se encontraron contactos que coincidan con "${searchTerm}".`
                  : 'No hay contactos disponibles en el sistema.'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}