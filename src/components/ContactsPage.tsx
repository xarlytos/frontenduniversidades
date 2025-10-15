import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, X, Upload, FileText } from 'lucide-react';
import { Contact, ContactFilters } from '../types';
import ContactForm from './ContactForm';
import ContactDetail from './ContactDetail';
import universidadesService, { Universidad } from '../services/universidadesService';
import titulacionesService from '../services/titulacionesService';
import { contactsService } from '../services/contactsService';
import { User } from '../types/auth';
import ExcelImportModal from './ExcelImportModal';
// import { useContacts } from '../hooks/useContacts'; // Removido - usar solo los props del padre
import * as XLSX from 'xlsx';


interface ContactsPageProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onUpdateContact: (id: string, contact: Omit<Contact, 'id' | 'fecha_alta'>) => void;
  onDeleteContact: (id: string) => Promise<void> | void;
  onDeleteMultipleContacts: (ids: string[]) => void;
  onRefreshContacts: () => Promise<void>;
  initialFilters?: Partial<ContactFilters>;
  currentUser: User | null;
  hasPermission: (action: 'view' | 'edit' | 'delete', contactOwnerId?: string) => Promise<boolean> | boolean;
}

export default function ContactsPage({
  contacts: propContacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onDeleteMultipleContacts,
  onRefreshContacts,
  initialFilters = {},
  currentUser,
  hasPermission
}: ContactsPageProps) {
  // Removido el hook useContacts para evitar duplicación de estado
  // Ahora usamos solo los contacts que vienen por props desde App.tsx
  
  const [filters, setFilters] = useState<ContactFilters>({
    universidad: initialFilters.universidad || '',
    titulacion: initialFilters.titulacion || '',
    curso: initialFilters.curso || '',
    search: initialFilters.search || '',
    aportado_por: '',
    consentimiento: ''
  });
  
  // Removido el estado local de contactos ya que ahora usamos solo propContacts
  
  // Efecto para detectar cambios en propContacts
  useEffect(() => {
    console.log('🔄 propContacts changed! New length:', propContacts.length);
    console.log('📋 First 3 contacts after change:', propContacts.slice(0, 3).map(c => c.nombre));
  }, [propContacts]);
  
  // Nuevos estados para datos de API
  const [universities, setUniversities] = useState<Universidad[]>([]);
  const [availableTitulaciones, setAvailableTitulaciones] = useState<string[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(true);
  const [loadingTitulaciones, setLoadingTitulaciones] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('');
  const contactsPerPage = 10;
  
  // Hook de permisos
  // Estado para manejar permisos de eliminación
  const [canDelete, setCanDelete] = useState(false);
  
  // Verificar permisos de eliminación cuando cambie el usuario
  useEffect(() => {
    const checkDeletePermission = async () => {
      console.log('🔍 ContactsPage: Verificando permisos de eliminación...');
      console.log('👤 ContactsPage: currentUser:', currentUser);
      console.log('🎭 ContactsPage: currentUser role:', currentUser?.role);
      
      if (currentUser?.role?.toLowerCase() === 'admin') {
        console.log('✅ ContactsPage: Usuario es admin, estableciendo canDelete = true');
        setCanDelete(true);
      } else {
        console.log('🔄 ContactsPage: Llamando hasPermission("delete")...');
        const result = await hasPermission('delete');
        console.log('📋 ContactsPage: Resultado de hasPermission("delete"):', result);
        setCanDelete(result);
        console.log('🎯 ContactsPage: Estado canDelete actualizado a:', result);
      }
    };
    
    checkDeletePermission();
  }, [currentUser, hasPermission]);
  
  // Usar directamente los contactos que vienen por props
  const contacts = propContacts;
  console.log('📊 Using contacts from props:', contacts.length);
      
  console.log('📊 ContactsPage - Final contacts to display:', contacts.length, contacts);

  // Removido el efecto de carga automática de contactos comerciales
  // ya que ahora todos los contactos vienen filtrados desde App.tsx

  // Cargar universidades al montar el componente
  useEffect(() => {
    const loadUniversities = async () => {
      try {
        console.log('🔄 Iniciando carga de universidades...');
        setLoadingUniversities(true);
        const universitiesData = await universidadesService.getUniversidades();
        console.log('📥 Respuesta completa del servicio:', universitiesData);
        console.log('📊 Total universidades recibidas:', universitiesData?.length || 0);
        
        // Filtrar universidades activas si tienen la propiedad estado
        const activeUniversities = universitiesData.filter(uni => 
          !('estado' in uni) || (uni as any).estado === 'activa'
        );
        console.log('✅ Universidades activas:', activeUniversities);
        console.log('📋 Nombres de universidades activas:', activeUniversities.map(u => u.nombre));
        
        setUniversities(activeUniversities);
        console.log('🏫 Estado de universidades actualizado');
      } catch (error: any) {
        console.error('❌ Error completo cargando universidades:', error);
        console.error('📄 Detalles del error:', {
          message: error?.message,
          response: error?.response,
          status: error?.response?.status,
          data: error?.response?.data
        });
        // Fallback a datos estáticos si falla la API
        setUniversities([]);
      } finally {
        setLoadingUniversities(false);
        console.log('🏁 Carga de universidades finalizada');
      }
    };

    loadUniversities();
  }, []);

  // Cargar titulaciones cuando cambia la universidad seleccionada
  useEffect(() => {
    const loadTitulaciones = async () => {
      if (!filters.universidad) {
        // Si no hay universidad seleccionada, mostrar todas las titulaciones de los contactos
        const allTitulaciones = [...new Set(contacts.map(c => c.titulacion).filter(Boolean))];
        setAvailableTitulaciones(allTitulaciones);
        return;
      }

      try {
        setLoadingTitulaciones(true);
        // Buscar la universidad seleccionada para obtener su ID
        const selectedUniversity = universities.find(uni => uni.nombre === filters.universidad);
        if (selectedUniversity) {
          const titulaciones = await titulacionesService.getTitulacionesPorUniversidad(selectedUniversity.id);
          const titulacionNames = titulaciones.map(tit => tit.nombre);
          setAvailableTitulaciones(titulacionNames);
          console.log('🎓 Titulaciones cargadas para', filters.universidad, ':', titulacionNames);
        } else {
          console.warn('⚠️ Universidad no encontrada:', filters.universidad);
          setAvailableTitulaciones([]);
        }
      } catch (error) {
        console.error('❌ Error cargando titulaciones:', error);
        // Fallback a titulaciones de contactos existentes
        const contactTitulaciones = contacts
          .filter(c => c.universidad === filters.universidad)
          .map(c => c.titulacion)
          .filter(Boolean);
        setAvailableTitulaciones([...new Set(contactTitulaciones)]);
      } finally {
        setLoadingTitulaciones(false);
      }
    };

    loadTitulaciones();
  }, [filters.universidad, universities, contacts]);

  const filteredContacts = useMemo(() => {
    console.log('🔍 ContactsPage - Current filters:', filters);
    console.log('📊 ContactsPage - Total contacts before filtering:', contacts.length);
    
    const filtered = contacts.filter(contact => {
      const matchesSearch = filters.search === '' || 
        contact.nombre.toLowerCase().includes(filters.search.toLowerCase()) ||
        (contact.telefono && contact.telefono.includes(filters.search));
      
      const matchesUniversidad = filters.universidad === '' || contact.universidad === filters.universidad;
      const matchesTitulacion = filters.titulacion === '' || contact.titulacion === filters.titulacion;
      const matchesCurso = filters.curso === '' || contact.curso?.toString() === filters.curso;
      
      return matchesSearch && matchesUniversidad && matchesTitulacion && matchesCurso;
    });
    
    console.log('✅ ContactsPage - Contacts after filtering:', filtered.length);
    return filtered;
  }, [contacts, filters]);

  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * contactsPerPage;
    const paginated = filteredContacts.slice(startIndex, startIndex + contactsPerPage);
    
    console.log('📊 ContactsPage - Contacts received as props:', contacts.length, contacts);
    console.log('🔍 ContactsPage - Filtered contacts:', filteredContacts.length, filteredContacts);
    console.log('📄 ContactsPage - Paginated contacts for rendering:', paginated.length, paginated);
    
    return paginated;
  }, [filteredContacts, currentPage, contacts]);

  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);

  // Función para generar páginas inteligentes (máximo 7 visibles)
  const generatePageNumbers = () => {
    const maxVisible = 7;
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisible) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Lógica para páginas inteligentes
      if (currentPage <= 4) {
        // Mostrar primeras páginas: 1 2 3 4 5 6 7 ... última
        for (let i = 1; i <= 6; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Mostrar últimas páginas: 1 ... penúltimas ... última
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 5; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Mostrar páginas centrales: 1 ... actual-2 actual-1 actual actual+1 actual+2 ... última
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Función para manejar salto a página
  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpToPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      setJumpToPage('');
    }
  };

  // Función para manejar tecla Enter en el input
  const handleJumpKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const handleFilterChange = (key: keyof ContactFilters, value: string) => {
    if (key === 'universidad') {
      // Reset titulación cuando cambia la universidad
      setFilters(prev => ({ ...prev, [key]: value, titulacion: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      universidad: '',
      titulacion: '',
      curso: '',
      search: '',
      aportado_por: '',
      consentimiento: ''
    });
    setCurrentPage(1);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormSubmit = async (contactData: Omit<Contact, 'id' | 'fecha_alta'>) => {
    console.log('📋 ContactsPage: Handling form submit', contactData);
    try {
      if (editingContact) {
        console.log('✏️ Updating existing contact:', editingContact.id);
        await onUpdateContact(editingContact.id, contactData);
      } else {
        console.log('➕ Adding new contact', contactData);
        console.log('🔍 onAddContact function:', onAddContact);
        console.log('👤 currentUser:', currentUser);
        const result = await onAddContact(contactData, currentUser);
        console.log('📤 onAddContact result:', result);
      }
      
      // Refrescar la lista de contactos después de crear/editar
      console.log('🔄 Refrescando lista de contactos...');
      await onRefreshContacts();
      
      setShowForm(false);
      setEditingContact(null);
      console.log('✅ Form submission completed and list refreshed');
    } catch (error) {
      console.error('❌ Error in form submission:', error);
    }
  };

  // Nuevas funciones para manejar selección
  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(paginatedContacts.map(contact => contact.id)));
    }
  };

  const handleImportContacts = async () => {
    // La importación se maneja directamente en el modal
    // Este callback se ejecuta después de una importación exitosa
    console.log('Importación completada, refrescando lista de contactos...');
    try {
      await onRefreshContacts();
      console.log('✅ Lista de contactos actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error al actualizar la lista de contactos:', error);
    }
  };

  const handleExportExcel = () => {
    const selectedContactsData = contacts.filter(contact => selectedContacts.has(contact.id));
    if (selectedContactsData.length === 0) {
      alert('Por favor, selecciona al menos un contacto para exportar');
      return;
    }
  
    try {
      // Preparar los datos para el Excel - incluyendo el nuevo campo
      const excelData = selectedContactsData.map(contact => ({
        'Nombre': contact.nombre || '',
        'Teléfono': contact.telefono || '',
        'Instagram': contact.instagram || '',
        'Universidad': contact.universidad || '',
        'Titulación': contact.titulacion || '',
        'Curso': contact.curso || '',
        'Día Libre': contact.dia_libre || '',
        'Año de Nacimiento': contact.año_nacimiento || '',
        'Comercial': contact.comercial_nombre || ''
      }));
  
      // Crear el libro de trabajo
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');
  
      // Ajustar el ancho de las columnas para los 9 campos
      const columnWidths = [
        { wch: 20 }, // Nombre
        { wch: 15 }, // Teléfono
        { wch: 15 }, // Instagram
        { wch: 25 }, // Universidad
        { wch: 30 }, // Titulación
        { wch: 8 },  // Curso
        { wch: 12 }, // Día Libre
        { wch: 15 }, // Año de Nacimiento
        { wch: 20 }  // Comercial
      ];
      worksheet['!cols'] = columnWidths;
  
      // Generar el nombre del archivo con fecha y hora
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const fileName = `contactos-exportados-${timestamp}.xlsx`;
  
      // Descargar el archivo
      XLSX.writeFile(workbook, fileName);
      
      console.log(`✅ Exportados ${selectedContactsData.length} contactos a Excel`);
    } catch (error) {
      console.error('❌ Error al exportar contactos:', error);
      alert('Error al exportar los contactos. Por favor, inténtalo de nuevo.');
    }
  };

  // Nueva función para manejar eliminación múltiple
  const handleDeleteSelected = async () => {
    try {
      const selectedIds = Array.from(selectedContacts);
      await onDeleteMultipleContacts(selectedIds);
      setSelectedContacts(new Set()); // Limpiar selección después de eliminar
      
      // Refrescar la lista de contactos después de eliminar
      console.log('🔄 Refrescando lista después de eliminación múltiple...');
      await onRefreshContacts();
    } catch (error) {
      console.error('❌ Error al eliminar contactos:', error);
    }
  };

  // Removida la función handleLoadComercialContacts ya que los contactos
  // ahora vienen filtrados desde App.tsx

  // Debug: Mostrar estado actual antes del render
  console.log('🎨 ContactsPage RENDER: canDelete =', canDelete);
  console.log('📋 ContactsPage RENDER: selectedContacts.size =', selectedContacts.size);
  console.log('🔍 ContactsPage RENDER: Condición para mostrar botón eliminar:', selectedContacts.size > 0 && canDelete);

  return (
    <div className="p-6">
      {/* Header con botones principales */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contactos</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {selectedContacts.size > 0 && canDelete && (
            <>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar ({selectedContacts.size})
              </button>
              {currentUser?.role?.toLowerCase() === 'admin' && (
                <button
                  onClick={handleExportExcel}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar Excel ({selectedContacts.size})
                </button>
              )}
            </>
          )}
          {currentUser?.role?.toLowerCase() === 'admin' && (
            <button
              onClick={() => setShowImportModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Excel
            </button>
          )}

          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contacto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Universidad
            </label>
            <select
              value={filters.universidad}
              onChange={(e) => handleFilterChange('universidad', e.target.value)}
              disabled={loadingUniversities}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {universities.map(uni => (
                <option key={uni._id} value={uni.nombre}>{uni.nombre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulación
            </label>
            <select
              value={filters.titulacion}
              onChange={(e) => handleFilterChange('titulacion', e.target.value)}
              disabled={loadingTitulaciones}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              {availableTitulaciones.map(tit => (
                <option key={tit} value={tit}>{tit}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Curso
            </label>
            <select
              value={filters.curso}
              onChange={(e) => handleFilterChange('curso', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              {[1, 2, 3, 4, 5, 6].map(curso => (
                <option key={curso} value={curso.toString()}>{curso}º</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla de contactos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instagram
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Universidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titulación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Día Libre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Año Nacimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comercial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Alta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedContacts.map((contact, index) => (
                <tr 
                  key={contact.id} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${selectedContacts.has(contact.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contact.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.telefono || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.instagram ? (
                      <a 
                        href={`https://instagram.com/${contact.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        @{contact.instagram.replace('@', '')}
                      </a>
                    ) : 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.universidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.titulacion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.curso ? `${contact.curso}º` : 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.dia_libre || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.año_nacimiento || 'N/D'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.comercial_nombre || 'Sin asignar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.fecha_alta).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingContact(contact)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(contact)}
                        className="text-green-600 hover:text-green-700"
                        disabled={!hasPermission('edit', contact.comercial_id)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {canDelete && (
                        <button
                          onClick={async () => {
                            try {
                              console.log('🗑️ Eliminando contacto:', contact.id);
                              const result = await onDeleteContact(contact.id);
                              console.log('📥 Delete result:', result);
                              
                              // Dar tiempo para que el estado se actualice
                              setTimeout(() => {
                                console.log('✅ Contacto eliminado y lista actualizada');
                              }, 100);
                            } catch (error) {
                              console.error('❌ Error al eliminar contacto:', error);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                          disabled={!hasPermission('edit', contact.comercial_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación Inteligente */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              {/* Versión móvil - solo botones Anterior/Siguiente */}
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-700 self-center">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
              
              {/* Versión desktop - paginación completa */}
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">{(currentPage - 1) * contactsPerPage + 1}</span>{' '}
                    a{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * contactsPerPage, filteredContacts.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium">{filteredContacts.length}</span> resultados
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Input para salto directo (solo si hay más de 10 páginas) */}
                  {totalPages > 10 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">Ir a página:</span>
                      <input
                        type="number"
                        min="1"
                        max={totalPages}
                        value={jumpToPage}
                        onChange={(e) => setJumpToPage(e.target.value)}
                        onKeyPress={handleJumpKeyPress}
                        placeholder="Número"
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleJumpToPage}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Ir
                      </button>
                    </div>
                  )}
                  
                  {/* Navegación de páginas */}
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {/* Botón Primera página */}
                    {currentPage > 4 && totalPages > 7 && (
                      <button
                        onClick={() => setCurrentPage(1)}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        1
                      </button>
                    )}
                    
                    {/* Botón Anterior */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentPage <= 4 && totalPages > 7 ? 'rounded-l-md' : ''
                      }`}
                    >
                      Anterior
                    </button>
                    
                    {/* Páginas inteligentes */}
                    {generatePageNumbers().map((page, index) => (
                      <button
                        key={index}
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={page === '...'}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 border-blue-600 text-white'
                            : page === '...'
                            ? 'bg-white border-gray-300 text-gray-500 cursor-default'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    {/* Botón Siguiente */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        currentPage >= totalPages - 3 && totalPages > 7 ? 'rounded-r-md' : ''
                      }`}
                    >
                      Siguiente
                    </button>
                    
                    {/* Botón Última página */}
                    {currentPage < totalPages - 3 && totalPages > 7 && (
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        {totalPages}
                      </button>
                    )}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Modals */}
        {showForm && (
          <ContactForm
            contact={editingContact}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingContact(null);
            }}
          />
        )}

        {viewingContact && (
          <ContactDetail
            contact={viewingContact}
            onClose={() => setViewingContact(null)}
            onEdit={() => {
              setEditingContact(viewingContact);
              setShowForm(true);
              setViewingContact(null);
            }}
          />
        )}

        {showImportModal && (
          <ExcelImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportContacts}
            existingContacts={contacts}
          />
        )}
      </div>
    );
}