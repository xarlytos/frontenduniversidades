import { apiService, ApiResponse } from './api';
import { User } from '../types/auth';

interface UsersResponse {
  usuarios: User[];
  total: number;
}

interface UserResponse {
  usuario: User;
}

export class UsersService {
  async getUsers(filters?: { rol?: string; estado?: string; busqueda?: string }): Promise<ApiResponse<UsersResponse>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/usuarios?${queryString}` : '/usuarios';
    
    return apiService.get<UsersResponse>(endpoint);
  }

  async getAllUsers(filters?: { rol?: string; estado?: string; busqueda?: string }): Promise<ApiResponse<UsersResponse>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const queryString = params.toString();
    const endpoint = queryString ? `/usuarios/todos?${queryString}` : '/usuarios/todos';
    
    return apiService.get<UsersResponse>(endpoint);
  }

  async getUser(id: string): Promise<ApiResponse<UserResponse>> {
    return apiService.get<UserResponse>(`/usuarios/${id}`);
  }

  async createUser(user: Omit<User, 'id' | 'fecha_creacion'> & { password: string }): Promise<ApiResponse<UserResponse>> {
    return apiService.post<UserResponse>('/usuarios', {
      email: user.email,
      password: user.password,
      nombre: user.nombre,
      rol: user.role, // Mapear 'role' a 'rol'
      activo: user.activo
    });
  }

  async updateUser(id: string, user: Partial<User>): Promise<ApiResponse<UserResponse>> {
    const backendUser: Record<string, unknown> = {};
    
    if (user.email) backendUser.email = user.email;
    if (user.nombre) backendUser.nombre = user.nombre;
    if (user.role) backendUser.rol = user.role;
    if (user.activo !== undefined) backendUser.activo = user.activo;
    
    return apiService.put<UserResponse>(`/usuarios/${id}`, backendUser);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiService.delete<void>(`/usuarios/${id}`);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiService.put<void>(`/usuarios/${id}/password`, {
      passwordActual: newPassword
    });
  }

  async getEffectivePermissions(id: string): Promise<ApiResponse<{ permisos: string[] }>> {
    return apiService.get<{ permisos: string[] }>(`/usuarios/${id}/permisos`);
  }

  async updateUserPermissions(id: string, permisos: string[]): Promise<ApiResponse<{ message: string }>> {
    return apiService.put<{ message: string }>(`/usuarios/${id}/permisos`, { permisos });
  }

  async getUserPermissions(id: string): Promise<ApiResponse<{ permisos: string[] }>> {
    return apiService.get<{ permisos: string[] }>(`/usuarios/${id}/permisos`);
  }

  async asignarJefe(subordinadoId: string, usuarioId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.post<{ message: string }>(`/usuarios/${subordinadoId}/asignar-jefe`, { usuarioId });
  }

  async removerJefe(subordinadoId: string): Promise<ApiResponse<{ message: string }>> {
    return apiService.delete<{ message: string }>(`/usuarios/${subordinadoId}/remover-jefe`);
  }

  async getJerarquias(): Promise<ApiResponse<{ jerarquias: any[] }>> {
    return apiService.get<{ jerarquias: any[] }>('/usuarios/jerarquias');
  }
}

export const usersService = new UsersService();

// Exportar funciones individuales para facilitar la importación
export const getUsers = (filters?: { rol?: string; estado?: string; busqueda?: string }) => usersService.getUsers(filters);
export const getAllUsers = (filters?: { rol?: string; estado?: string; busqueda?: string }) => usersService.getAllUsers(filters);
export const getUser = (id: string) => usersService.getUser(id);
export const createUser = (user: Omit<User, 'id' | 'fecha_creacion'> & { password: string }) => usersService.createUser(user);
export const updateUser = (id: string, user: Partial<User>) => usersService.updateUser(id, user);
export const deleteUser = (id: string) => usersService.deleteUser(id);
export const changePassword = (id: string, currentPassword: string, newPassword: string) => usersService.changePassword(id, currentPassword, newPassword);
export const getEffectivePermissions = (id: string) => usersService.getEffectivePermissions(id);
export const updateUserPermissions = (id: string, permisos: string[]) => usersService.updateUserPermissions(id, permisos);
export const getUserPermissions = (id: string) => usersService.getUserPermissions(id);
export const asignarJefe = (subordinadoId: string, usuarioId: string) => usersService.asignarJefe(subordinadoId, usuarioId);
export const removerJefe = (subordinadoId: string) => usersService.removerJefe(subordinadoId);
export const getJerarquias = () => usersService.getJerarquias();