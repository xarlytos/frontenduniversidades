import React, { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { Shield, Key, Users, Trash2, Check, X, Settings, GraduationCap, ChevronDown, ChevronUp, Building2, BookOpen, Loader2, Plus, TrendingUp, Edit } from 'lucide-react';
import { usersService } from '../services/usersService';
import { AVAILABLE_PERMISSIONS, Permission } from '../constants/permissions';
import universidadesService, { Universidad, CreateUniversidadData, UpdateUniversidadData } from '../services/universidadesService';
import titulacionesService, { CreateTitulacionData as CreateTitulacionFormData } from '../services/titulacionesService';
import { contactsService } from '../services/contactsService';

interface AdminPanelProps {
  users: User[];
  currentUser: User;
  onUpdateUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  onToggleDeletePermission: (userId: string, canDelete: boolean) => Promise<boolean>;
  getUserDeletePermission: (userId: string) => Promise<boolean>;
}

export default function AdminPanel({ 
  users, 
  currentUser, 
  onUpdateUserPassword, 
  onToggleDeletePermission,
  getUserDeletePermission 
}: AdminPanelProps) {
  console.log('AdminPanel - users recibidos:', users);
  console.log('AdminPanel - tipo de users:', typeof users);
  console.log('AdminPanel - es array:', Array.isArray(users));
  
  const [activeTab, setActiveTab] = useState<'permissions' | 'passwords' | 'universities' | 'contacts'>('permissions');
  const [passwordForm, setPasswordForm] = useState<{userId: string; newPassword: string; confirmPassword: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [permissionsModal, setPermissionsModal] = useState<{userId: string; userName: string; userPermissions: string[]; selectedPermissionIds: string[]} | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [userPermissionsMap, setUserPermissionsMap] = useState<Map<string, string[]>>(new Map());
  const [expandedUniversities, setExpandedUniversities] = useState<Set<string>>(new Set());
  const [universities, setUniversities] = useState<Universidad[]>([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [showCreateUniversityModal, setShowCreateUniversityModal] = useState(false);
  const [createUniversityForm, setCreateUniversityForm] = useState<CreateUniversidadData>({
    nombre: '',
    codigo: '',
    ciudad: '',
    pais: 'España',
    tipo: 'publica',
    activa: true
  });
  const [creatingUniversity, setCreatingUniversity] = useState(false);
  const [increasingCourse, setIncreasingCourse] = useState(false);
  const [showEditUniversityModal, setShowEditUniversityModal] = useState(false);
  const [editUniversityForm, setEditUniversityForm] = useState<{ id: string; nombre: string; codigo: string }>({
    id: '',
    nombre: '',
    codigo: ''
  });
  const [editingUniversity, setEditingUniversity] = useState(false);
  const [deletingUniversity, setDeletingUniversity] = useState(false);
  const [editingUniversityTitulaciones, setEditingUniversityTitulaciones] = useState<any[]>([]);
  const [showInlineTitulacionForm, setShowInlineTitulacionForm] = useState(false);
  const [editingTitulacionIndex, setEditingTitulacionIndex] = useState<number | null>(null);
  const [editTitulacionForm, setEditTitulacionForm] = useState({
    id: '',
    nombre: '',
    codigo: '',
    duracion: 4
  });
  const [creatingTitulacion, setCreatingTitulacion] = useState(false);
  const [editingTitulacion, setEditingTitulacion] = useState(false);

  // Debug useEffect para monitorear cambios en selectedPermissions
  useEffect(() => {
    console.log('🔍 selectedPermissions cambió:', selectedPermissions);
  }, [selectedPermissions]);
  
  // Sincronizar selectedPermissions cuando el modal se abre con permisos precargados
  useEffect(() => {
    if (permissionsModal && permissionsModal.selectedPermissionIds) {
      console.log('🔍 Sincronizando permisos del modal:', permissionsModal.selectedPermissionIds);
      setSelectedPermissions(permissionsModal.selectedPermissionIds);
    }
  }, [permissionsModal]);
  
  // Cargar permisos de todos los usuarios comerciales al montar el componente
  useEffect(() => {
    const loadAllUserPermissions = async () => {
      const newPermissionsMap = new Map<string, string[]>();
      for (const user of comercialUsers) {
        try {
          const response = await usersService.getUserPermissions(user.id) as any;
          if (response.success && response.permisos) {
            newPermissionsMap.set(user.id, response.permisos);
          }
        } catch (error) {
          console.error(`Error loading permissions for user ${user.id}:`, error);
        }
      }
      setUserPermissionsMap(newPermissionsMap);
    };
    
    if (comercialUsers.length > 0) {
      loadAllUserPermissions();
    }
  }, [users]);
  
  // Cargar universidades cuando se selecciona el tab de universidades
  useEffect(() => {
    const loadUniversities = async () => {
      if (activeTab === 'universities' && universities.length === 0) {
        setLoadingUniversities(true);
        try {
          const data = await universidadesService.getUniversidades();
          console.log('🎓 Universidades cargadas:', data);
          setUniversities(data);
        } catch (error) {
          console.error('Error loading universities:', error);
        } finally {
          setLoadingUniversities(false);
        }
      }
    };
    
    loadUniversities();
  }, [activeTab, universities.length]);
  
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const comercialUsers = users.filter(user => user.role === 'comercial');
  
  const toggleUniversity = (universityId: string) => {
    setExpandedUniversities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(universityId)) {
        newSet.delete(universityId);
      } else {
        newSet.add(universityId);
      }
      return newSet;
    });
  };

  // Función para abrir el modal de configuración de permisos
  const openPermissionsModal = async (userId: string, userName: string) => {
    console.log('🚀🚀🚀 openPermissionsModal INICIADO para:', { userId, userName });
    setLoadingPermissions(true);
    try {
      console.log('🚀 Fetching permissions for user:', userId);
      const response = await usersService.getUserPermissions(userId) as any;
      console.log('🚀 API Response completa:', JSON.stringify(response, null, 2));
      console.log('🚀 response.success:', response.success);
      console.log('🚀 response.permisos:', response.permisos);
      
      if (response.success && response.permisos) {
        // Los permisos vienen directamente en response.permisos, no en response.data.permisos
        const userPermissions = response.permisos || [];
        console.log('🚀 User permissions (claves) extraídas:', userPermissions);
        console.log('🚀 Tipo de userPermissions:', typeof userPermissions);
        console.log('🚀 Es array?:', Array.isArray(userPermissions));
        console.log('🚀 Longitud del array:', userPermissions.length);
        console.log('🚀 AVAILABLE_PERMISSIONS completo:', AVAILABLE_PERMISSIONS);
        
        // Convertir las claves de permisos a IDs
        console.log('🚀 Iniciando conversión de claves a IDs...');
        const permissionIds: string[] = [];
        
        if (Array.isArray(userPermissions) && userPermissions.length > 0) {
          for (let i = 0; i < userPermissions.length; i++) {
            const userPermission = userPermissions[i];
            console.log(`🚀 [${i}] Buscando clave: "${userPermission}" (tipo: ${typeof userPermission})`);
            const found = AVAILABLE_PERMISSIONS.find(p => {
              console.log(`   Comparando con: "${p.clave}" - ¿Coincide? ${p.clave === userPermission}`);
              return p.clave === userPermission;
            });
            if (found) {
              console.log(`✅✅✅ Encontrado: ${found.clave} -> ID: ${found.id}`);
              permissionIds.push(found.id);
            } else {
              console.log(`❌❌❌ No encontrado: ${userPermission}`);
            }
          }
        } else {
          console.log('⚠️⚠️⚠️ userPermissions está vacío o no es un array válido');
        }
        
        console.log('🚀🚀 Permission IDs finales:', permissionIds);
        console.log('🚀🚀 Cantidad de IDs convertidos:', permissionIds.length);
        
        // IMPORTANTE: Actualizar el estado de los permisos seleccionados ANTES de abrir el modal
        setSelectedPermissions(permissionIds);
        // Pasar los IDs directamente al modal para evitar problemas de sincronización de estado
        setPermissionsModal({ userId, userName, userPermissions, selectedPermissionIds: permissionIds });
        console.log('🔍 Modal state set with selected permissions:', permissionIds);
      } else {
        console.log('❌ API response not successful or no data:', response);
        // Aún así, abrir el modal con permisos vacíos
        setSelectedPermissions([]);
        setPermissionsModal({ userId, userName, userPermissions: [], selectedPermissionIds: [] });
        console.log('🔍 Modal opened with empty permissions');
      }
    } catch (error) {
      console.error('❌ Error loading user permissions:', error);
      alert('Error al cargar los permisos del usuario');
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Función para guardar los permisos
  const savePermissions = async () => {
    if (!permissionsModal) return;

    setLoadingPermissions(true);
    try {
      const response = await usersService.updateUserPermissions(permissionsModal.userId, selectedPermissions);
      if (response.success) {
        // Actualizar el mapa de permisos con los nuevos permisos
        const permissionClaves = selectedPermissions.map(id => {
          const permission = AVAILABLE_PERMISSIONS.find(p => p.id === id);
          return permission ? permission.clave : '';
        }).filter(clave => clave !== '');
        
        setUserPermissionsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(permissionsModal.userId, permissionClaves);
          return newMap;
        });
        
        alert('Permisos actualizados correctamente');
        setPermissionsModal(null);
        setSelectedPermissions([]);
      } else {
        alert('Error al actualizar los permisos');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Error al actualizar los permisos');
    } finally {
      setLoadingPermissions(false);
    }
  };

  // Función para alternar un permiso
  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    onUpdateUserPassword(passwordForm.userId, passwordForm.newPassword);
    setPasswordForm(null);
    alert('Contraseña actualizada exitosamente');
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createUniversityForm.nombre || !createUniversityForm.codigo) {
      alert('El nombre y código son obligatorios');
      return;
    }

    setCreatingUniversity(true);
    try {
      await universidadesService.createUniversidad(createUniversityForm);
      
      // Recargar la lista de universidades
      const data = await universidadesService.getUniversidades();
      setUniversities(data);
      
      // Resetear el formulario y cerrar el modal
      setCreateUniversityForm({
        nombre: '',
        codigo: '',
        ciudad: '',
        pais: 'España',
        tipo: 'publica',
        activa: true
      });
      setShowCreateUniversityModal(false);
      
      alert('Universidad creada exitosamente');
    } catch (error: any) {
      console.error('Error creating university:', error);
      alert(error.message || 'Error al crear la universidad');
    } finally {
      setCreatingUniversity(false);
    }
  };

  const openEditUniversityModal = (university: Universidad) => {
    setEditUniversityForm({
      id: (university as any)._id || university.id,
      nombre: university.nombre,
      codigo: university.codigo
    });
    setEditingUniversityTitulaciones((university as any).titulaciones || []);
    setShowEditUniversityModal(true);
  };

  const openEditTitulacionModal = (titulacion: any, index: number) => {
    setEditTitulacionForm({
      id: titulacion._id || titulacion.id,
      nombre: titulacion.nombre,
      codigo: titulacion.codigo,
      duracion: titulacion.duracion || 4
    });
    setEditingTitulacionIndex(index);
    setShowInlineTitulacionForm(true);
  };

  const handleDeleteTitulacion = async (titulacionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta titulación?')) {
      return;
    }

    try {
      await titulacionesService.deleteTitulacion(titulacionId);
      setEditingUniversityTitulaciones(prev => prev.filter(t => t._id !== titulacionId));
      alert('Titulación eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting titulacion:', error);
      alert(error.message || 'Error al eliminar la titulación');
    }
  };

  const handleCreateTitulacion = async (e: React.FormEvent) => {
    console.log('🚀 handleCreateTitulacion iniciado');
    console.log('📝 Event:', e);
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📋 Form data:', editTitulacionForm);
    console.log('🏫 University ID:', editUniversityForm.id);
    
    if (!editTitulacionForm.nombre || !editTitulacionForm.codigo) {
      console.log('❌ Validación fallida: campos obligatorios vacíos');
      alert('El nombre y código son obligatorios');
      return;
    }

    setCreatingTitulacion(true);
    try {
      const createData = {
        nombre: editTitulacionForm.nombre,
        codigo: editTitulacionForm.codigo,
        duracion: editTitulacionForm.duracion,
        universidadId: editUniversityForm.id, // Corregir nombre del campo
        tipo: 'grado',
        activa: true
      };
      
      console.log('📤 Datos a enviar:', createData);
      
      const response = await titulacionesService.createTitulacion(createData);
      console.log('📥 Respuesta del servidor:', response);
      
      // Verificar estructura de respuesta
      const newTitulacion = response.data || response;
      console.log('🆕 Nueva titulación procesada:', newTitulacion);
      
      // Add the new titulacion to the local state
      setEditingUniversityTitulaciones(prev => {
        const updated = [...prev, {
          _id: newTitulacion.id || newTitulacion._id,
          nombre: newTitulacion.nombre,
          codigo: newTitulacion.codigo,
          duracion: newTitulacion.duracion
        }];
        console.log('📊 Estado actualizado:', updated);
        return updated;
      });
      
      // Reset form and hide it
      setEditTitulacionForm({ id: '', nombre: '', codigo: '', duracion: 4 });
      setShowInlineTitulacionForm(false);
      
      console.log('✅ Titulación creada exitosamente');
      alert('Titulación creada exitosamente');
    } catch (error: any) {
      console.error('❌ Error creating titulacion:', error);
      console.log('📄 Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.message?.includes('permisos')) {
        alert('No tienes permisos para crear titulaciones. Contacta al administrador.');
      } else {
        alert(error.message || 'Error al crear la titulación');
      }
    } finally {
      setCreatingTitulacion(false);
      console.log('🏁 handleCreateTitulacion finalizado');
    }
  };

  const handleUpdateTitulacion = async (e: React.FormEvent) => {
    console.log('🔄 handleUpdateTitulacion iniciado');
    console.log('📝 Event:', e);
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📋 Form data:', editTitulacionForm);
    console.log('📍 Editing index:', editingTitulacionIndex);
    
    if (!editTitulacionForm.nombre || !editTitulacionForm.codigo || editingTitulacionIndex === null) {
      console.log('❌ Validación fallida: campos obligatorios vacíos o índice nulo');
      alert('El nombre y código son obligatorios');
      return;
    }

    setEditingTitulacion(true);
    try {
      const { id, ...updateData } = editTitulacionForm;
      const requestData = {
        nombre: updateData.nombre,
        codigo: updateData.codigo,
        duracion: updateData.duracion,
        tipo: 'grado'
      };
      
      console.log('📤 Datos a enviar:', requestData);
      console.log('🆔 ID de titulación:', id);
      
      const response = await titulacionesService.updateTitulacion(id, requestData);
      console.log('📥 Respuesta del servidor:', response);
      
      // Verificar estructura de respuesta
      const updatedTitulacion = response.data || response;
      console.log('🔄 Titulación actualizada procesada:', updatedTitulacion);
      
      // Update the titulacion in the local state
      setEditingUniversityTitulaciones(prev => {
        const updated = prev.map((t, index) => index === editingTitulacionIndex ? {
          ...t,
          nombre: updatedTitulacion.nombre,
          codigo: updatedTitulacion.codigo,
          duracion: updatedTitulacion.duracion
        } : t);
        console.log('📊 Estado actualizado:', updated);
        return updated;
      });
      
      // Reset form and hide it
      setEditTitulacionForm({ id: '', nombre: '', codigo: '', duracion: 4 });
      setEditingTitulacionIndex(null);
      setShowInlineTitulacionForm(false);
      
      console.log('✅ Titulación actualizada exitosamente');
      alert('Titulación actualizada exitosamente');
    } catch (error: any) {
      console.error('❌ Error updating titulacion:', error);
      console.log('📄 Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.message?.includes('permisos')) {
        alert('No tienes permisos para actualizar titulaciones. Contacta al administrador.');
      } else {
        alert(error.message || 'Error al actualizar la titulación');
      }
    } finally {
      setEditingTitulacion(false);
      console.log('🏁 handleUpdateTitulacion finalizado');
    }
  };

  const handleEditUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editUniversityForm.nombre || !editUniversityForm.codigo) {
      alert('El nombre y código son obligatorios');
      return;
    }

    setEditingUniversity(true);
    try {
      const { id, ...updateData } = editUniversityForm;
      await universidadesService.updateUniversidad(id, updateData);
      
      // Recargar la lista de universidades
      const data = await universidadesService.getUniversidades();
      setUniversities(data);
      
      // Cerrar el modal
      setShowEditUniversityModal(false);
      
      alert('Universidad actualizada exitosamente');
    } catch (error: any) {
      console.error('Error updating university:', error);
      alert(error.message || 'Error al actualizar la universidad');
    } finally {
      setEditingUniversity(false);
    }
  };

  // Función para eliminar universidad
  const handleDeleteUniversity = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta universidad? Esta acción no se puede deshacer.')) {
      return;
    }

    setDeletingUniversity(true);
    try {
      await universidadesService.deleteUniversidad(editUniversityForm.id);
      
      // Recargar la lista de universidades
      const data = await universidadesService.getUniversidades();
      setUniversities(data);
      
      // Cerrar el modal
      setShowEditUniversityModal(false);
      
      alert('Universidad eliminada exitosamente');
    } catch (error: any) {
      console.error('Error deleting university:', error);
      alert(error.message || 'Error al eliminar la universidad');
    } finally {
      setDeletingUniversity(false);
    }
  };

  const cancelTitulacionForm = () => {
    setEditTitulacionForm({ id: '', nombre: '', codigo: '', duracion: 4 });
    setEditingTitulacionIndex(null);
    setShowInlineTitulacionForm(false);
  };

  const handleIncreaseAllCourses = async () => {
    if (!confirm('¿Estás seguro de que quieres aumentar el curso de todos los contactos en 1? Esta acción no se puede deshacer.')) {
      return;
    }

    setIncreasingCourse(true);
    try {
      const response = await contactsService.aumentarCursoTodos();
      if (response.success) {
        alert(`Curso aumentado exitosamente. ${response.data.modifiedCount} contactos actualizados.`);
      } else {
        alert('Error al aumentar el curso de los contactos');
      }
    } catch (error: any) {
      console.error('Error increasing courses:', error);
      alert(error.message || 'Error al aumentar el curso de los contactos');
    } finally {
      setIncreasingCourse(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-purple-600" />
          Panel de Administrador
        </h1>
        <p className="text-gray-600 mt-1">Gestión de permisos y usuarios del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Gestión de Permisos
          </button>
          <button
            onClick={() => setActiveTab('passwords')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'passwords'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Gestión de Contraseñas
          </button>
          <button
            onClick={() => setActiveTab('universities')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'universities'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-4 h-4 inline mr-2" />
            Universidades
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contacts'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Gestión de Contactos
          </button>
        </nav>
      </div>

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Gestión de Permisos del Sistema</h3>
            <p className="text-sm text-blue-700">
              Administra todos los permisos de los usuarios comerciales del sistema. Cada permiso controla el acceso a diferentes funcionalidades.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Usuarios Comerciales</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {comercialUsers.map((user) => {
                const userPermissions = userPermissionsMap.get(user.id) || [];
                const filteredPermissions = userPermissions.filter(permiso => 
                  permiso === 'VER_CONTACTOS' || permiso === 'ELIMINAR_CONTACTOS'
                );
                const hasPermissions = filteredPermissions.length > 0;
                
                return (
                  <div key={user.id} className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{user.nombre}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          
                          {/* Mostrar permisos */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {hasPermissions ? (
                              filteredPermissions.map((permiso) => (
                                <span 
                                  key={permiso}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  title={AVAILABLE_PERMISSIONS.find(p => p.clave === permiso)?.descripcion}
                                >
                                  {permiso === 'ELIMINAR_CONTACTOS' && <Trash2 className="w-3 h-3 mr-1" />}
                                  {permiso === 'CREAR_CONTACTOS' && '➕'}
                                  {permiso === 'EDITAR_CONTACTOS' && '✏️'}
                                  {permiso === 'VER_CONTACTOS' && '👁️'}
                                  {permiso === 'IMPORTAR_CONTACTOS' && '📥'}
                                  {permiso === 'EXPORTAR_CONTACTOS' && '📤'}
                                  {permiso === 'GESTIONAR_USUARIOS' && '👥'}
                                  {permiso === 'VER_ESTADISTICAS' && '📊'}
                                  {permiso === 'GESTIONAR_UNIVERSIDADES' && '🎓'}
                                  {permiso.replace(/_/g, ' ')}
                                </span>
                              ))
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                <X className="w-3 h-3 mr-1" /> Sin permisos asignados
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => openPermissionsModal(user.id, user.nombre)}
                        disabled={loadingPermissions}
                        className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors disabled:opacity-50 ml-4"
                      >
                        <Settings className="w-4 h-4 inline mr-1" />
                        Configurar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Passwords Tab */}
      {activeTab === 'passwords' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Gestión de Contraseñas</h3>
            <p className="text-sm text-yellow-700">
              Cambia las contraseñas de cualquier usuario del sistema. Los usuarios serán notificados del cambio.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">Todos los Usuarios</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {users.filter(user => user.id !== currentUser.id).map((user) => (
                <div key={user.id} className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      user.role === 'admin' ? 'bg-purple-100' : 'bg-green-100'
                    }`}>
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Users className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.nombre}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Comercial'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setPasswordForm({
                      userId: user.id,
                      newPassword: '',
                      confirmPassword: ''
                    })}
                    className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors"
                  >
                    <Key className="w-4 h-4 inline mr-1" />
                    Cambiar Contraseña
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Universities Tab */}
      {activeTab === 'universities' && (
        <div className="space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-medium text-indigo-900 mb-2">Gestión de Universidades y Titulaciones</h3>
            <p className="text-sm text-indigo-700">
              Visualiza todas las universidades disponibles en el sistema y sus titulaciones asociadas. 
              Total de universidades: {universities.length}
            </p>
          </div>

          {loadingUniversities ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-600">Cargando universidades...</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-indigo-600" />
                  Listado de Universidades
                </h4>
                <button
                  onClick={() => setShowCreateUniversityModal(true)}
                  className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nueva Universidad
                </button>
              </div>
              
              {universities.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay universidades registradas en el sistema.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-200">
                    {universities.map((university) => {
                      const universityId = (university as any)._id || university.id;
                      const titulaciones = (university as any).titulaciones || [];
                      const isExpanded = expandedUniversities.has(universityId);
                      
                      return (
                        <div key={universityId} className="overflow-hidden">
                          <div className="px-4 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div 
                                className="flex items-center space-x-3 flex-1 cursor-pointer"
                                onClick={() => toggleUniversity(universityId)}
                              >
                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-lg">
                                    {university.nombre}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>Código: {university.codigo}</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      (university as any).estado === 'activa' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {(university as any).estado || 'activa'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditUniversityModal(university);
                                  }}
                                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                  title="Editar universidad"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                  {titulaciones.length} titulaciones
                                </span>
                                <div 
                                  className="cursor-pointer p-1"
                                  onClick={() => toggleUniversity(universityId)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="bg-gray-50 px-4 py-4">
                              {titulaciones.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">
                                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                  <p className="text-sm">No hay titulaciones registradas para esta universidad.</p>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {titulaciones.map((titulacion: any) => (
                                      <div 
                                        key={titulacion._id}
                                        className="bg-white p-3 rounded-md border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                                      >
                                        <p className="text-sm font-medium text-gray-900 flex items-center">
                                          <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                                          {titulacion.nombre}
                                        </p>
                                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                                          <p>Código: {titulacion.codigo}</p>
                                          <p className="capitalize">Tipo: {titulacion.tipo}</p>
                                          <p>{titulacion.duracion} años - {titulacion.creditos} créditos</p>
                                          <p className="capitalize">Modalidad: {titulacion.modalidad}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-500">
                                        Total de titulaciones en {university.nombre}: 
                                        <span className="font-medium text-gray-900 ml-1">{titulaciones.length}</span>
                                      </span>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Total de universidades en el sistema: 
                        <span className="font-medium text-gray-900 ml-1">{universities.length}</span>
                      </span>
                      <span className="text-gray-600">
                        Total de titulaciones: 
                        <span className="font-medium text-gray-900 ml-1">
                          {universities.reduce((total, uni) => {
                            const titulaciones = (uni as any).titulaciones || [];
                            return total + titulaciones.length;
                          }, 0)}
                        </span>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-900 mb-2">Gestión de Contactos</h3>
            <p className="text-sm text-orange-700">
              Herramientas administrativas para la gestión masiva de contactos en el sistema.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                Operaciones Masivas
              </h4>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Aumentar Curso de Todos los Contactos
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Esta operación incrementará en 1 el campo "curso" de todos los contactos en la base de datos.
                        <strong className="block mt-1">⚠️ Esta acción no se puede deshacer.</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">Promoción de Curso</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Actualiza automáticamente el curso de todos los estudiantes para el nuevo año académico.
                  </p>
                </div>
                <button
                  onClick={handleIncreaseAllCourses}
                  disabled={increasingCourse}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {increasingCourse ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Aumentar Curso a Todos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Configuration Modal */}
      {permissionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {console.log('🔍 Modal is rendering:', permissionsModal)}
          {console.log('🔍 selectedPermissions en render:', selectedPermissions)}
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Configurar Permisos - {permissionsModal.userName}
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Selecciona los permisos que deseas asignar a este usuario:
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                 {console.log('🎯 RENDERIZANDO MODAL - selectedPermissions actual:', selectedPermissions)}
                 {console.log('🎯 RENDERIZANDO MODAL - permissionsModal:', permissionsModal)}
                 {AVAILABLE_PERMISSIONS.filter(permission => 
                   permission.clave === 'VER_CONTACTOS' || permission.clave === 'ELIMINAR_CONTACTOS'
                 ).map((permission) => {
                   const isChecked = selectedPermissions.includes(permission.id);
                   console.log(`🔍 Checkbox ${permission.clave} (ID: ${permission.id}): checked=${isChecked}, selectedPermissions=${JSON.stringify(selectedPermissions)}`);
                   return (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`permission-${permission.id}`}
                      checked={isChecked}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor={`permission-${permission.id}`} className="block text-sm font-medium text-gray-900 cursor-pointer">
                        {permission.clave}
                      </label>
                      <p className="text-sm text-gray-500 mt-1">
                        {permission.descripcion}
                      </p>
                    </div>
                  </div>
                   );
                 })}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                 {selectedPermissions.length} de {AVAILABLE_PERMISSIONS.filter(permission => 
                   permission.clave === 'VER_CONTACTOS' || permission.clave === 'ELIMINAR_CONTACTOS'
                 ).length} permisos seleccionados
               </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setPermissionsModal(null);
                    setSelectedPermissions([]);
                  }}
                  disabled={loadingPermissions}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={savePermissions}
                  disabled={loadingPermissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loadingPermissions ? 'Guardando...' : 'Guardar Permisos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {passwordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Cambiar Contraseña
            </h3>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => prev ? {...prev, newPassword: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => prev ? {...prev, confirmPassword: e.target.value} : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="showPassword" className="text-sm text-gray-600">
                  Mostrar contraseñas
                </label>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordForm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create University Modal */}
      {showCreateUniversityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                Nueva Universidad
              </h3>
              <button
                onClick={() => {
                  setShowCreateUniversityModal(false);
                  setCreateUniversityForm({
                    nombre: '',
                    codigo: '',
                    ciudad: '',
                    pais: 'España',
                    tipo: 'publica',
                    activa: true
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUniversity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Universidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createUniversityForm.nombre}
                  onChange={(e) => setCreateUniversityForm(prev => ({...prev, nombre: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Universidad Politécnica de Valencia"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createUniversityForm.codigo}
                  onChange={(e) => setCreateUniversityForm(prev => ({...prev, codigo: e.target.value.toUpperCase()}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: UPV"
                  required
                  maxLength={10}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={createUniversityForm.ciudad}
                    onChange={(e) => setCreateUniversityForm(prev => ({...prev, ciudad: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Valencia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={createUniversityForm.pais}
                    onChange={(e) => setCreateUniversityForm(prev => ({...prev, pais: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: España"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Universidad
                </label>
                <select
                  value={createUniversityForm.tipo}
                  onChange={(e) => setCreateUniversityForm(prev => ({...prev, tipo: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="publica">Pública</option>
                  <option value="privada">Privada</option>
                  <option value="concertada">Concertada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={createUniversityForm.activa ? 'activa' : 'inactiva'}
                  onChange={(e) => setCreateUniversityForm(prev => ({
                    ...prev, 
                    activa: e.target.value === 'activa'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={creatingUniversity}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {creatingUniversity ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Universidad
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUniversityModal(false);
                    setCreateUniversityForm({
                      nombre: '',
                      codigo: '',
                      ciudad: '',
                      pais: 'España',
                      tipo: 'publica',
                      activa: true
                    });
                  }}
                  disabled={creatingUniversity}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit University Modal */}
      {showEditUniversityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-indigo-600" />
                Editar Universidad
              </h3>
              <button
                onClick={() => setShowEditUniversityModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditUniversity} className="space-y-6">
              {/* Información básica de la universidad */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Información de la Universidad</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Universidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editUniversityForm.nombre}
                      onChange={(e) => setEditUniversityForm(prev => ({...prev, nombre: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej: Universidad Politécnica de Valencia"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Código <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editUniversityForm.codigo}
                      onChange={(e) => setEditUniversityForm(prev => ({...prev, codigo: e.target.value.toUpperCase()}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej: UPV"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Gestión de Titulaciones */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                    Titulaciones
                  </h4>
                  {!showInlineTitulacionForm && (
                    <button
                      type="button"
                      onClick={() => setShowInlineTitulacionForm(true)}
                      className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Nueva Titulación
                    </button>
                  )}
                </div>
                
                {/* Formulario inline para crear/editar titulación */}
                {showInlineTitulacionForm && (
                  <div className="bg-white p-4 rounded-md border border-blue-200 mb-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {editingTitulacionIndex !== null ? 'Editar Titulación' : 'Nueva Titulación'}
                    </h5>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editTitulacionForm.nombre}
                            onChange={(e) => setEditTitulacionForm(prev => ({...prev, nombre: e.target.value}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Ej: Ingeniería Informática"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editTitulacionForm.codigo}
                            onChange={(e) => setEditTitulacionForm(prev => ({...prev, codigo: e.target.value.toUpperCase()}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Ej: II"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duración (años) <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={editTitulacionForm.duracion}
                            onChange={(e) => setEditTitulacionForm(prev => ({...prev, duracion: parseInt(e.target.value)}))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            required
                          >
                            <option value={3}>3 años</option>
                            <option value={4}>4 años</option>
                            <option value={5}>5 años</option>
                            <option value={6}>6 años</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (editingTitulacionIndex !== null) {
                              handleUpdateTitulacion(e);
                            } else {
                              handleCreateTitulacion(e);
                            }
                          }}
                          disabled={creatingTitulacion || editingTitulacion}
                          className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          {(creatingTitulacion || editingTitulacion) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              {editingTitulacionIndex !== null ? 'Actualizando...' : 'Creando...'}
                            </>
                          ) : (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              {editingTitulacionIndex !== null ? 'Actualizar' : 'Crear'}
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelTitulacionForm();
                          }}
                          disabled={creatingTitulacion || editingTitulacion}
                          className="flex items-center px-3 py-1.5 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Lista de titulaciones */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {editingUniversityTitulaciones.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No hay titulaciones registradas para esta universidad.</p>
                    </div>
                  ) : (
                    editingUniversityTitulaciones.map((titulacion, index) => (
                      <div key={titulacion._id} className="bg-white p-3 rounded-md border border-gray-200 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{titulacion.nombre}</p>
                          <div className="text-sm text-gray-500 space-x-4">
                            <span>Código: {titulacion.codigo}</span>
                            <span>Duración: {titulacion.duracion} años</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => openEditTitulacionModal(titulacion, index)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Editar titulación"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTitulacion(titulacion._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar titulación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={editingUniversity || deletingUniversity}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {editingUniversity ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Actualizar Universidad
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUniversity}
                  disabled={editingUniversity || deletingUniversity}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {deletingUniversity ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Borrar Universidad
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditUniversityModal(false)}
                  disabled={editingUniversity || deletingUniversity}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
  