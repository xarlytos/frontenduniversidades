import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit, Trash2, Plus, Eye, EyeOff, X } from 'lucide-react';
import { User } from '../types/auth';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../hooks/useAuth';
import { asignarJefe, removerJefe, deleteUser, updateUser } from '../services/usersService';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser?: (newUser: Omit<User, 'id' | 'fecha_creacion'> & { password: string }) => Promise<boolean>;
  onUpdateUser?: (userId: string, updatedData: Partial<User>) => Promise<boolean>;
  onDeleteUser?: (userId: string) => Promise<boolean>;
}

interface EditUserForm {
  nombre: string;
  email: string;
  role: 'admin' | 'comercial';
  activo: boolean;
}

interface NewUserForm {
  nombre: string;
  email: string;
  password: string;
  role: 'admin' | 'comercial';
}

export default function UserManagement({ 
  users, 
  currentUser, 
  onAddUser, 
  onUpdateUser, 
  onDeleteUser 
}: UserManagementProps) {

  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editUserForm, setEditUserForm] = useState<EditUserForm>({
    nombre: '',
    email: '',
    role: 'comercial',
    activo: true
  });
  const [editFormErrors, setEditFormErrors] = useState<Partial<EditUserForm>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    nombre: '',
    email: '',
    password: '',
    role: 'comercial'
  });
  const [formErrors, setFormErrors] = useState<Partial<NewUserForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);

  const { getAllUsers } = useAuth();
  const { 
    grantPermission, 
    revokePermission, 
    hasPermission, 
    hasPermissionWithHierarchy,
    getAllPermissions,
    assignComercialToJefe,
    removeComercialFromJefe,
    getComercialJefe,
    getJefeSubordinados,
    reloadHierarchies
  } = usePermissions();

  // Cargar todos los usuarios para la gestión de permisos
  useEffect(() => {
    const loadAllUsers = async () => {
      setLoadingAllUsers(true);
      try {
        const mappedUsers = await getAllUsers();
        
        if (mappedUsers && mappedUsers.length > 0) {
          setAllUsers(mappedUsers);
        } else {
          setAllUsers(users);
        }
      } catch (error) {
        console.error('Error al cargar todos los usuarios:', error);
        // Fallback a usar los usuarios del prop si falla la carga
        setAllUsers(users);
      } finally {
        setLoadingAllUsers(false);
      }
    };

    loadAllUsers();
  }, [users]);

  // Usar allUsers para la gestión de permisos, users para la tabla principal
  const comerciales = allUsers.filter(user => user.role === 'comercial');
  const admins = users.filter(user => user.role === 'admin');

  const handlePermissionChange = (fromUserId: string, toUserId: string, granted: boolean) => {
    if (granted) {
      grantPermission(fromUserId, toUserId, currentUser.id);
      console.log(`✅ Permission granted: User ${toUserId} can now see contacts from ${fromUserId}`);
    } else {
      revokePermission(fromUserId, toUserId);
      console.log(`❌ Permission revoked: User ${toUserId} can no longer see contacts from ${fromUserId}`);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      activo: user.activo
    });
    setShowEditForm(true);
    setEditFormErrors({});
  };

  const validateEditForm = (): boolean => {
    const errors: Partial<EditUserForm> = {};
    
    if (!editUserForm.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!editUserForm.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editUserForm.email)) {
      errors.email = 'El email no es válido';
    } else if (users.some(user => user.email.toLowerCase() === editUserForm.email.toLowerCase() && user.id !== editingUser?.id)) {
      errors.email = 'Este email ya está registrado';
    }
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEditForm() || !editingUser) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const updatedData: Partial<User> = {
        nombre: editUserForm.nombre.trim(),
        email: editUserForm.email.toLowerCase().trim(),
        role: editUserForm.role,
        activo: editUserForm.activo
      };
      
      // Si hay una función onUpdateUser proporcionada, la usamos
      if (onUpdateUser) {
        const success = await onUpdateUser(editingUser.id, updatedData);
        if (!success) {
          console.error('❌ Error al actualizar usuario');
          return;
        }
      } else {
        // Usar el servicio directo si no hay función proporcionada
        const response = await updateUser(editingUser.id, updatedData);
        if (!response.success) {
          console.error('❌ Error al actualizar usuario:', response.error);
          return;
        }
      }
      
      // Cerrar modal y resetear formulario
      setShowEditForm(false);
      setEditingUser(null);
      setEditFormErrors({});
      console.log('✅ Usuario actualizado correctamente');
      
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setEditFormErrors({});
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Si hay una función onDeleteUser proporcionada, la usamos en lugar del servicio directo
      if (onDeleteUser) {
        const success = await onDeleteUser(userId);
        if (success) {
          setShowDeleteConfirm(null);
          console.log('✅ Usuario eliminado correctamente');
        } else {
          console.error('❌ Error al eliminar usuario');
        }
      } else {
        // Solo usar el servicio directo si no hay función proporcionada
        const response = await deleteUser(userId);
        if (response.success) {
          setShowDeleteConfirm(null);
          console.log('✅ Usuario eliminado correctamente');
        } else {
          console.error('❌ Error al eliminar usuario:', response.error);
        }
      }
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<NewUserForm> = {};
    
    if (!newUserForm.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    
    if (!newUserForm.email.trim()) {
      errors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUserForm.email)) {
      errors.email = 'El email no es válido';
    } else if (users.some(user => user.email.toLowerCase() === newUserForm.email.toLowerCase())) {
      errors.email = 'Este email ya está registrado';
    }
    
    if (!newUserForm.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (newUserForm.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newUser: Omit<User, 'id' | 'fecha_creacion'> = {
        nombre: newUserForm.nombre.trim(),
        email: newUserForm.email.toLowerCase().trim(),
        role: newUserForm.role,
        activo: true,
        ultimo_acceso: undefined
      };
      
      // Si hay una función onAddUser proporcionada, la usamos
      if (onAddUser) {
        const success = await onAddUser({ ...newUser, password: newUserForm.password });
        if (!success) {
          console.error('❌ Error al crear usuario');
          return;
        }
      } else {
        // Simulamos la creación del usuario (en una app real esto sería una llamada a la API)
        const userWithId: User = {
          ...newUser,
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fecha_creacion: new Date().toISOString()
        };
        
        console.log('✅ Usuario creado:', userWithId);
        // Aquí normalmente actualizarías el estado global de usuarios
      }
      
      // Resetear formulario y cerrar modal
      setNewUserForm({
        nombre: '',
        email: '',
        password: '',
        role: 'comercial'
      });
      setFormErrors({});
      setShowAddForm(false);
      
    } catch (error) {
      console.error('❌ Error al crear usuario:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddForm(false);
    setNewUserForm({
      nombre: '',
      email: '',
      password: '',
      role: 'comercial'
    });
    setFormErrors({});
  };

  const handleJefeAssignment = async (comercialId: string, jefeId: string | null) => {
    try {
      if (jefeId) {
        // Hacer petición HTTP para asignar jefe
        const response = await asignarJefe(comercialId, jefeId);
        if (response.success) {
          // Actualizar estado local solo si la petición fue exitosa
          assignComercialToJefe(comercialId, jefeId, currentUser.id);
          console.log(`👥 Comercial ${comercialId} asignado a jefe ${jefeId}`);
          // Recargar jerarquías desde el backend para sincronizar
          await reloadHierarchies();
        } else {
          console.error('❌ Error al asignar jefe:', response.error);
        }
      } else {
        // Hacer petición HTTP para remover jefe
        const response = await removerJefe(comercialId);
        if (response.success) {
          // Actualizar estado local solo si la petición fue exitosa
          removeComercialFromJefe(comercialId);
          console.log(`🗑️ Comercial ${comercialId} removido de jerarquía`);
          // Recargar jerarquías desde el backend para sincronizar
          await reloadHierarchies();
        } else {
          console.error('❌ Error al remover jefe:', response.error);
        }
      }
    } catch (error) {
      console.error('❌ Error en la operación de jerarquía:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra usuarios y permisos del sistema</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Modal de Editar Usuario */}
      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Editar Usuario</h3>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitEditUser} className="p-6 space-y-4">
              {/* Campo Nombre */}
              <div>
                <label htmlFor="edit-nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="edit-nombre"
                  value={editUserForm.nombre}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    editFormErrors.nombre ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {editFormErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{editFormErrors.nombre}</p>
                )}
              </div>

              {/* Campo Email */}
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    editFormErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="juan@empresa.com"
                />
                {editFormErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{editFormErrors.email}</p>
                )}
              </div>

              {/* Campo Rol */}
              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  id="edit-role"
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'comercial' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="comercial">Comercial</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Campo Estado */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editUserForm.activo}
                    onChange={(e) => setEditUserForm(prev => ({ ...prev, activo: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Usuario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Usuario</h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitNewUser} className="p-6 space-y-4">
              {/* Campo Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={newUserForm.nombre}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, nombre: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.nombre ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan Pérez"
                />
                {formErrors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nombre}</p>
                )}
              </div>

              {/* Campo Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="juan@empresa.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  id="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>
              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Comerciales</p>
              <p className="text-2xl font-bold text-gray-900">{comerciales.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Usuarios</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-purple-100' : 'bg-green-100'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Users className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Comercial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.ultimo_acceso 
                      ? new Date(user.ultimo_acceso).toLocaleDateString('es-ES')
                      : 'Nunca'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        disabled={user.id === currentUser.id}
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title="Eliminar usuario"
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
      </div>

      {/* Gestión de Permisos - NUEVA SECCIÓN */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Gestión de Permisos entre Comerciales</h3>
          <p className="text-sm text-gray-600 mt-1">
            Asigna comerciales a jefes para gestionar la visibilidad de contactos
          </p>
        </div>
        
        <div className="p-6">
          {loadingAllUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Cargando usuarios...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Sección de Asignación de Jerarquía */}
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Asignación de Jerarquía</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {comerciales.map(comercial => {
                const jefeActual = getComercialJefe(comercial.id);
                const jefeInfo = jefeActual ? allUsers.find(u => u.id === jefeActual) : null;
                
                return (
                  <div key={comercial.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-gray-900">{comercial.nombre}</h5>
                          <p className="text-xs text-gray-500">{comercial.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">
                        Trabaja para:
                      </label>
                      <select
                        value={jefeActual || ''}
                        onChange={(e) => handleJefeAssignment(comercial.id, e.target.value || null)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Nadie asignado</option>
                        {allUsers
                          .filter(u => u.id !== comercial.id)
                          .map(usuario => (
                            <option key={usuario.id} value={usuario.id}>
                              {usuario.nombre} ({usuario.role === 'admin' ? 'Admin' : 'Comercial'})
                            </option>
                          ))
                        }
                      </select>
                      
                      {jefeInfo && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                          📋 Reporta a: <strong>{jefeInfo.nombre}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección de Visualización de Jerarquías */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-900 mb-4">Estructura Jerárquica</h4>
            <div className="space-y-4">
              {(() => {
                // Obtener todas las jerarquías activas
                const jerarquias = new Map<string, string[]>();
                
                // Agrupar comerciales por jefe
                comerciales.forEach(comercial => {
                  const jefeId = getComercialJefe(comercial.id);
                  if (jefeId) {
                    if (!jerarquias.has(jefeId)) {
                      jerarquias.set(jefeId, []);
                    }
                    jerarquias.get(jefeId)?.push(comercial.id);
                  }
                });
                
                if (jerarquias.size === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay jerarquías configuradas</p>
                      <p className="text-sm">Asigna comerciales a jefes para crear la estructura</p>
                    </div>
                  );
                }
                
                return Array.from(jerarquias.entries()).map(([jefeId, subordinadosIds]) => {
                  const jefe = allUsers.find(u => u.id === jefeId);
                  const subordinados = subordinadosIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean);
                  
                  if (!jefe) return null;
                  
                  return (
                    <div key={jefeId} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                      {/* Jefe */}
                      <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{jefe.nombre}</div>
                          <div className="text-xs text-gray-500">{jefe.email}</div>
                          <div className="text-xs text-purple-600 font-medium">
                            {jefe.role === 'admin' ? 'Administrador' : 'Jefe'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Línea conectora */}
                      <div className="ml-5 border-l-2 border-gray-200 pl-4">
                        {/* Subordinados */}
                        <div className="space-y-3">
                          {subordinados.map((subordinado) => (
                            <div key={subordinado?.id} className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subordinado?.nombre}</div>
                                <div className="text-xs text-gray-500">{subordinado?.email}</div>
                                <div className="text-xs text-green-600 font-medium">Comercial</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Estadísticas */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{subordinados.length} comercial{subordinados.length !== 1 ? 'es' : ''} asignado{subordinados.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Debug Section - Actualizada */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Debug - Estado Actual:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">Jerarquías:</div>
              {comerciales.map(comercial => {
                const jefe = getComercialJefe(comercial.id);
                const jefeNombre = jefe ? allUsers.find(u => u.id === jefe)?.nombre : 'No trabaja para nadie';
                return (
                  <div key={comercial.id}>
                    {comercial.nombre} → {jefeNombre}
                  </div>
                );
              })}
              
              <div className="font-medium mt-2"></div>
              {getAllPermissions().map(perm => (
                <div key={perm.id}>
                  Usuario {allUsers.find(u => u.id === perm.comercial_id)?.nombre} puede ver contactos de: {
                    perm.puede_ver_contactos_de.map(id => allUsers.find(u => u.id === id)?.nombre).join(', ')
                  }
                </div>
              ))}
              {getAllPermissions().length === 0 && (
                <div></div>
              )}
            </div>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}