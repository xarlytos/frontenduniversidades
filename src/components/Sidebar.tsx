import React, { useEffect, useState } from 'react';
import { Users, BarChart3, Settings, LogOut, Shield, User, UserCog, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../types/auth';
import { authService } from '../services/authService';

interface SidebarProps {
  currentPage: 'contactos' | 'conteo' | 'usuarios' | 'admin' | 'contactoscompleta';
  onPageChange: (page: 'contactos' | 'conteo' | 'usuarios' | 'admin' | 'contactoscompleta') => void;
  user: UserType | null;
  onLogout: () => void;
  onToggleSidebar?: () => void;  // Nueva prop
}

export default function Sidebar({ currentPage, onPageChange, user, onLogout, onToggleSidebar }: SidebarProps) {
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Obtener permisos del usuario cuando esté autenticado
  useEffect(() => {
    console.log('🔄 Sidebar useEffect - Starting permissions load for user:', user?.id);
    if (user) {
      console.log('👤 Sidebar useEffect - User exists, calling authService.getPermissions()');
      authService.getPermissions()
        .then(response => {
          console.log('📥 Sidebar useEffect - Raw API response:', response);
          if (response.success && response.permisos) {
            console.log('✅ Sidebar useEffect - Setting permissions:', response.permisos);
            setUserPermissions(response.permisos);
            console.log('🔍 Sidebar useEffect - User permissions loaded and set:', response.permisos);
          } else {
            console.log('❌ Sidebar useEffect - Response not successful or no permisos:', response);
          }
        })
        .catch(error => {
          console.error('❌ Sidebar useEffect - Error loading permissions:', error);
        });
    } else {
      console.log('❌ Sidebar useEffect - No user, clearing permissions');
      setUserPermissions([]);
    }
  }, [user]);

  // Debug: Log user data to console
  console.log('🔍 Sidebar Render - User data:', user);
  console.log('🔍 Sidebar Render - User role:', user?.role);
  console.log('🔍 Sidebar Render - Is admin?', user?.role === 'ADMIN' || user?.role === 'admin');
  console.log('🔍 Sidebar Render - Current userPermissions state:', userPermissions);
  console.log('🔍 Sidebar Render - Permissions length:', userPermissions.length);
  console.log('🔍 Sidebar Render - Additional info:', {
    currentPage,
    userExists: !!user,
    userRole: user?.role,
    userId: user?.id,
    userName: user?.nombre,
    permissionsCount: userPermissions.length,
    permissions: userPermissions
  });
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header con botón toggle */}
      <div className="p-6 border-b border-gray-200 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Base de Contactos</h1>
          <p className="text-sm text-gray-500">Gestión Universitaria</p>
        </div>
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Ocultar sidebar"
          >
            <EyeOff className="w-5 h-5" />
          </button>
        )}
      </div>
      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user.role === 'admin' || user.role === 'ADMIN' ? 'bg-purple-100' : 'bg-green-100'
            }`}>
              {user.role === 'admin' || user.role === 'ADMIN' ? (
                <Shield className="w-5 h-5 text-purple-600" />
              ) : (
                <User className="w-5 h-5 text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.nombre}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => onPageChange('contactos')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                currentPage === 'contactos'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Users className="w-5 h-5 mr-3" />
              Contactos
            </button>
          </li>
          <li>
            <button
              onClick={() => onPageChange('conteo')}
              className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                currentPage === 'conteo'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Conteo
            </button>
          </li>
          {(() => {
            console.log('🔍 Sidebar Debug - Checking ContactosCompleta visibility:');
            console.log('👤 User role:', user?.role);
            console.log('📋 User permissions:', userPermissions);
            console.log('✅ Has VER_CONTACTOS:', userPermissions.includes('VER_CONTACTOS'));
            console.log('🔑 Is admin:', user?.role === 'admin' || user?.role === 'ADMIN');
            
            const canViewContactosCompleta = userPermissions.includes('VER_CONTACTOS') || user?.role === 'admin' || user?.role === 'ADMIN';
            console.log('🎯 Can view ContactosCompleta:', canViewContactosCompleta);
            
            return canViewContactosCompleta;
          })() && (
            <li>
              <button
                onClick={() => onPageChange('contactoscompleta')}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                  currentPage === 'contactoscompleta'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Eye className="w-5 h-5 mr-3" />
                Contactos Completa
              </button>
            </li>
          )}
          {(user?.role === 'admin' || user?.role === 'ADMIN') && (
            <>
              <li>
                <button
                  onClick={() => onPageChange('admin')}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    currentPage === 'admin'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <UserCog className="w-5 h-5 mr-3" />
                  Panel Administrador
                </button>
              </li>
              <li>
                <button
                  onClick={() => onPageChange('usuarios')}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    currentPage === 'usuarios'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Gestión de Usuarios
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Cerrar Sesión
        </button>
        
        <div className="mt-4">
          <button
            onClick={() => {
              const contacts = JSON.parse(localStorage.getItem('contacts_database') || '[]');
              console.log('🔍 Debug - Stored contacts:', contacts.length);
              console.log('👤 Current user:', user);
            }}
            className="text-xs text-blue-600 hover:text-blue-700 underline"
          >
            Debug Storage
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">© 2025 Base de Contactos</p>
      </div>
    </div>
  );
}