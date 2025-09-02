import { apiService, ApiResponse } from './api';
import { User, LoginCredentials } from '../types/auth';

interface LoginResponse {
  usuario: User;
  token: string;
}

interface PermissionsResponse {
  permisos: string[];
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    console.log('🔐 AuthService.login called with:', { email: credentials.email });
    
    const response = await apiService.post<LoginResponse>('/auth/login', {
      email: credentials.email,
      password: credentials.password
    });
    
    console.log('🔐 AuthService.login response:', response);
    
    if (response.success && response.data) {
      console.log('🔐 Setting token:', response.data.token ? 'Token received' : 'No token');
      apiService.setToken(response.data.token);
    } else {
      console.log('🔐 Login failed in authService:', response);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await apiService.post<void>('/auth/logout');
    apiService.clearToken();
    return response;
  }

  async getProfile(): Promise<ApiResponse<{ usuario: User }>> {
    return apiService.get<{ usuario: User }>('/auth/profile');
  }

  async getPermissions(): Promise<ApiResponse<PermissionsResponse>> {
    return apiService.get<PermissionsResponse>('/auth/permissions');
  }
}

export const authService = new AuthService();