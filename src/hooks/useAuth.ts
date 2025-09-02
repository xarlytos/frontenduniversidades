import { useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginCredentials } from '../types/auth';
import { authService } from '../services/authService';
import { usersService } from '../services/usersService';

const STORAGE_KEY = 'auth_session';

const saveSession = (user: User) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

const loadSession = (): User | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading session:', error);
    return null;
  }
};

const clearSession = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesión al inicializar
  useEffect(() => {
    const savedUser = loadSession();
    if (savedUser) {
      // Verificar si el token sigue siendo válido
      authService.getProfile()
        .then(response => {
          if (response.success && response.data && response.data.usuario) {
            const updatedUser = {
              id: response.data.usuario._id,
              email: response.data.usuario.email,
              nombre: response.data.usuario.nombre,
              role: response.data.usuario.rol,
              activo: response.data.usuario.estado === 'ACTIVO',
              fecha_creacion: response.data.usuario.createdAt,
              ultimo_acceso: response.data.usuario.ultimoAccesoAt  // ✅ Cambiar de updatedAt
            };
            console.log('🔍 useAuth Debug - Updated user from profile:', updatedUser);
            saveSession(updatedUser);
            setAuthState({
              user: updatedUser,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            // Token inválido, limpiar sesión
            clearSession();
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        })
        .catch(() => {
          // Error al verificar token, limpiar sesión
          clearSession();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('🚀 useAuth.login started with:', { email: credentials.email });
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await authService.login(credentials);
      console.log('🚀 useAuth.login received response:', response);
      
      if (response.success && response.data) {
        console.log('🚀 Processing successful response:', response.data);
        
        const user: User = {
          id: response.data.usuario._id,
          email: response.data.usuario.email,
          nombre: response.data.usuario.nombre,
          role: response.data.usuario.rol,
          activo: response.data.usuario.activo,
          fecha_creacion: response.data.usuario.createdAt,
          ultimo_acceso: response.data.usuario.ultimoAccesoAt  // ✅ Correcto
        };
        
        console.log('🚀 Mapped user object:', user);
    
        saveSession(user);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
    
        console.log('✅ Login successful:', user.nombre, `(${user.role})`);
        return { success: true };
      } else {
        console.log('❌ Response indicates failure:', response);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        const errorMessage = response.error || 'Error de autenticación';
        setError(errorMessage);
        console.log('❌ Login failed:', errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.log('💥 Exception in useAuth.login:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = 'Error de conexión con el servidor';
      setError(errorMessage);
      console.error('❌ Login error:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearSession();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      setError(null);
      console.log('👋 User logged out');
    }
  }, []);

  const updateUserPassword = useCallback(async (userId: string, newPassword: string): Promise<boolean> => {
    if (authState.user?.role?.toLowerCase() !== 'admin') {
      console.log('❌ Only admin can update passwords');
      return false;
    }

    try {
      const response = await usersService.changePassword(userId, '', newPassword);
      if (response.success) {
        console.log('✅ Password updated for user:', userId);
        return true;
      } else {
        console.log('❌ Failed to update password:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating password:', error);
      return false;
    }
  }, [authState.user]);

  const toggleDeletePermission = useCallback(async (userId: string, canDelete: boolean): Promise<boolean> => {
    if (authState.user?.role?.toLowerCase() !== 'admin') {
      console.log('❌ Only admin can manage delete permissions');
      return false;
    }

    try {
      // Obtener permisos actuales del usuario usando authService
      const permissionsResponse = await authService.getPermissions();
      if (!permissionsResponse.success) {
        console.log('❌ Failed to get user permissions');
        return false;
      }

      // Actualizar usuario con nuevo permiso de eliminación
      const updateResponse = await usersService.updateUser(userId, {
        // Aquí necesitarías implementar la lógica específica para permisos de eliminación
        // según cómo esté estructurado en tu backend
      });

      if (updateResponse.success) {
        console.log(`✅ Delete permission ${canDelete ? 'granted' : 'revoked'} for user:`, userId);
        return true;
      } else {
        console.log('❌ Failed to update delete permission:', updateResponse.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating delete permission:', error);
      return false;
    }
  }, [authState.user]);

  const getUserDeletePermission = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const response = await authService.getPermissions();
      if (response.success && response.data) {
        // Verificar si el usuario tiene permiso de eliminación
        return response.data.permisos.includes('ELIMINAR_CONTACTOS');
      }
      return false;
    } catch (error) {
      console.error('❌ Error getting delete permission:', error);
      return false;
    }
  }, []);

  const hasPermission = useCallback(async (action: 'view' | 'edit' | 'delete', contactOwnerId?: string): Promise<boolean> => {
    console.log('🔍 useAuth hasPermission called with:', { action, contactOwnerId });
    console.log('👤 useAuth current user:', authState.user);
    
    if (!authState.user) {
      console.log('❌ useAuth: No user found');
      return false;
    }
    
    // Admin tiene todos los permisos
    if (authState.user.role?.toLowerCase() === 'admin') {
      console.log('✅ useAuth: User is admin, returning true');
      return true;
    }
    
    try {
      console.log('🔄 useAuth: Getting permissions from API...');
      const response = await authService.getPermissions();
      console.log('📥 useAuth: API response:', response);
      
      if (!response.success || !response.permisos) {
        console.log('❌ useAuth: Invalid API response');
        return false;
      }

      const permissions = response.permisos;
      console.log('📋 useAuth: Available permissions:', permissions);
      
      // Mapear acciones a nombres de permisos
      const permissionMap = {
        'view': 'VER_CONTACTOS',
        'edit': 'EDITAR_CONTACTOS',
        'delete': 'ELIMINAR_CONTACTOS'
      };

      const requiredPermission = permissionMap[action];
      console.log('🎯 useAuth: Required permission for action "' + action + '":', requiredPermission);
      
      const hasRequiredPermission = permissions.includes(requiredPermission);
      console.log('✅ useAuth: Has required permission:', hasRequiredPermission);

      // Para comerciales, verificar también si es el propietario del contacto
      if (authState.user.role === 'comercial' && contactOwnerId) {
        console.log('🏢 useAuth: User is comercial, checking ownership...');
        console.log('🆔 useAuth: contactOwnerId:', contactOwnerId);
        console.log('👤 useAuth: authState.user.id:', authState.user.id);
        console.log('👤 useAuth: authState.user.userId:', (authState.user as any).userId);
        
        const userId = authState.user.id || (authState.user as any).userId;
        const isOwner = contactOwnerId === userId;
        console.log('🔍 useAuth: Is owner:', isOwner);
        
        const result = hasRequiredPermission && isOwner;
        console.log('📊 useAuth: Final result for comercial:', result);
        return result;
      }

      console.log('📊 useAuth: Final result:', hasRequiredPermission);
      return hasRequiredPermission;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  }, [authState.user]);

  const getAllUsers = useCallback(async (): Promise<User[]> => {
    if (authState.user?.role?.toLowerCase() !== 'admin') {
      return [];
    }
    
    try {
      const response = await usersService.getAllUsers();
      if (response.success && response.usuarios) {
        const mappedUsers = response.usuarios.map(user => ({
          id: user._id,
          email: user.email,
          nombre: user.nombre,
          role: user.rol.toLowerCase(),
          activo: user.estado === 'ACTIVO',
          fecha_creacion: user.createdAt,
          ultimo_acceso: user.ultimoAccesoAt  // ✅ Cambiar de la línea incorrecta actual
        }));
        setUsers(mappedUsers);
        return mappedUsers;
      }
      return [];
    } catch (error) {
      console.error('❌ Error getting users:', error);
      return [];
    }
  }, [authState.user]);

  const updateUser = useCallback(async (userId: string, updatedData: Partial<User>): Promise<boolean> => {
    if (authState.user?.role?.toLowerCase() !== 'admin') {
      console.log('❌ Only admin can update users');
      return false;
    }
  
    try {
      // Mapear datos del frontend al formato del backend
      const backendData = {
        nombre: updatedData.nombre,
        email: updatedData.email,
        rol: updatedData.role,
        activo: updatedData.activo
      };

      const response = await usersService.updateUser(userId, backendData);
      if (response.success) {
        console.log('✅ User updated:', updatedData.nombre);
        // Actualizar lista local de usuarios
        await getAllUsers();
        return true;
      } else {
        console.log('❌ Failed to update user:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating user:', error);
      return false;
    }
  }, [authState.user, getAllUsers]);
  
  const deleteUser = useCallback(async (userId: string): Promise<boolean> => {
    if (authState.user?.role?.toLowerCase() !== 'admin') {
      console.log('❌ Only admin can delete users');
      return false;
    }
  
    if (userId === authState.user.id) {
      console.log('❌ Cannot delete current user');
      return false;
    }
  
    try {
      const response = await usersService.deleteUser(userId);
      if (response.success) {
        console.log('✅ User deleted:', userId);
        // Actualizar lista local de usuarios
        await getAllUsers();
        return true;
      } else {
        console.log('❌ Failed to delete user:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return false;
    }
  }, [authState.user, getAllUsers]);
  
  const addUser = useCallback(async (newUserData: Omit<User, 'id' | 'fecha_creacion'> & { password: string }): Promise<boolean> => {
    if (authState.user?.role?.toLowerCase() !== 'admin') {
      console.log('❌ Only admin can add users');
      return false;
    }
  
    try {
      // Mapear datos del frontend al formato del backend
      const backendData = {
        nombre: newUserData.nombre,
        email: newUserData.email,
        password: newUserData.password,
        rol: newUserData.role,
        activo: newUserData.activo
      };

      const response = await usersService.createUser(backendData);
      if (response.success) {
        console.log('✅ User added:', newUserData.nombre);
        // Actualizar lista local de usuarios
        await getAllUsers();
        return true;
      } else {
        console.log('❌ Failed to add user:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error adding user:', error);
      return false;
    }
  }, [authState.user, getAllUsers]);

  return {
    ...authState,
    users,
    error,
    login,
    logout,
    hasPermission,
    getAllUsers,
    updateUserPassword,
    toggleDeletePermission,
    getUserDeletePermission,
    updateUser,
    deleteUser,
    addUser
  };
}