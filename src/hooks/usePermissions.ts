import { useState, useEffect, useCallback } from 'react';
import { Permission, ComercialHierarchy } from '../types/auth';

const PERMISSIONS_STORAGE_KEY = 'commercial_permissions';
const HIERARCHY_STORAGE_KEY = 'commercial_hierarchy';

// Utility functions for permissions storage
const savePermissionsToStorage = (permissions: Permission[]) => {
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(permissions));
    console.log('✅ Permissions saved to localStorage:', permissions.length, 'permissions');
  } catch (error) {
    console.error('❌ Failed to save permissions to localStorage:', error);
  }
};

const loadPermissionsFromStorage = (): Permission[] => {
  try {
    const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Permissions loaded from localStorage:', parsed.length, 'permissions');
      return parsed;
    }
  } catch (error) {
    console.error('❌ Failed to load permissions from localStorage:', error);
  }
  
  console.log('📝 No stored permissions found, initializing empty');
  return [];
};

// Nuevas funciones para jerarquía
const saveHierarchyToStorage = (hierarchies: ComercialHierarchy[]) => {
  try {
    localStorage.setItem(HIERARCHY_STORAGE_KEY, JSON.stringify(hierarchies));
    console.log('✅ Hierarchies saved to localStorage:', hierarchies.length, 'hierarchies');
  } catch (error) {
    console.error('❌ Failed to save hierarchies to localStorage:', error);
  }
};

const loadHierarchyFromStorage = (): ComercialHierarchy[] => {
  try {
    const stored = localStorage.getItem(HIERARCHY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ Hierarchies loaded from localStorage:', parsed.length, 'hierarchies');
      return parsed;
    }
  } catch (error) {
    console.error('❌ Failed to load hierarchies from localStorage:', error);
  }
  
  console.log('📝 No stored hierarchies found, initializing empty');
  return [];
};

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>(() => loadPermissionsFromStorage());
  const [hierarchies, setHierarchies] = useState<ComercialHierarchy[]>(() => loadHierarchyFromStorage());

  // Save to localStorage whenever permissions or hierarchies change
  useEffect(() => {
    savePermissionsToStorage(permissions);
  }, [permissions]);

  useEffect(() => {
    saveHierarchyToStorage(hierarchies);
  }, [hierarchies]);

  // Nuevas funciones para gestión de jerarquía
  const assignComercialToJefe = useCallback((comercialId: string, jefeId: string, assignedBy: string) => {
    const newHierarchy: ComercialHierarchy = {
      id: `hier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jefe_id: jefeId,
      comercial_id: comercialId,
      asignado_por: assignedBy,
      fecha_asignacion: new Date().toISOString()
    };

    console.log('👥 Assigning comercial to jefe:', newHierarchy);
    
    setHierarchies(prev => {
      // Remove existing hierarchy for this comercial
      const filtered = prev.filter(h => h.comercial_id !== comercialId);
      return [...filtered, newHierarchy];
    });
  }, []);

  const removeComercialFromJefe = useCallback((comercialId: string) => {
    console.log('🗑️ Removing comercial from jefe:', comercialId);
    
    setHierarchies(prev => 
      prev.filter(h => h.comercial_id !== comercialId)
    );
  }, []);

  const getComercialJefe = useCallback((comercialId: string): string | null => {
    const hierarchy = hierarchies.find(h => h.comercial_id === comercialId);
    return hierarchy ? hierarchy.jefe_id : null;
  }, [hierarchies]);

  const getJefeSubordinados = useCallback((jefeId: string): string[] => {
    return hierarchies
      .filter(h => h.jefe_id === jefeId)
      .map(h => h.comercial_id);
  }, [hierarchies]);

  // Función mejorada para verificar permisos con jerarquía
  const hasPermissionWithHierarchy = useCallback((userId: string, targetUserId: string): boolean => {
    // 1. El usuario siempre puede ver sus propios contactos
    if (userId === targetUserId) {
      return true;
    }

    // 2. Verificar si es jefe y puede ver contactos de subordinados
    const subordinados = getJefeSubordinados(userId);
    if (subordinados.includes(targetUserId)) {
      return true;
    }

    // 3. Verificar permisos explícitos (sistema anterior)
    const hasExplicitPermission = permissions.some(permission => 
      permission.comercial_id === userId && 
      permission.puede_ver_contactos_de.includes(targetUserId)
    );

    console.log(`🔍 Permission check: User ${userId} can see contacts from ${targetUserId}:`, hasExplicitPermission || subordinados.includes(targetUserId));
    return hasExplicitPermission;
  }, [permissions, getJefeSubordinados]);

  const grantPermission = useCallback((fromUserId: string, toUserId: string, grantedBy: string) => {
    const newPermission: Permission = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      comercial_id: toUserId,
      puede_ver_contactos_de: [fromUserId],
      puede_editar_contactos_de: [], // Por ahora solo lectura
      otorgado_por: grantedBy,
      fecha_creacion: new Date().toISOString()
    };

    console.log('➕ Granting permission:', newPermission);
    
    setPermissions(prev => {
      // Remove existing permission if exists
      const filtered = prev.filter(p => 
        !(p.comercial_id === toUserId && p.puede_ver_contactos_de.includes(fromUserId))
      );
      return [...filtered, newPermission];
    });
  }, []);

  const revokePermission = useCallback((fromUserId: string, toUserId: string) => {
    console.log('🗑️ Revoking permission from', fromUserId, 'to', toUserId);
    
    setPermissions(prev => 
      prev.filter(p => 
        !(p.comercial_id === toUserId && p.puede_ver_contactos_de.includes(fromUserId))
      )
    );
  }, []);

  const hasPermission = useCallback((userId: string, targetUserId: string): boolean => {
    // Verificar si userId tiene permiso para ver contactos de targetUserId
    const hasAccess = permissions.some(permission => 
      permission.comercial_id === userId && 
      permission.puede_ver_contactos_de.includes(targetUserId)
    );
    
    console.log(`🔍 Permission check: User ${userId} can see contacts from ${targetUserId}:`, hasAccess);
    return hasAccess;
  }, [permissions]);

  const getUserPermissions = useCallback((userId: string): string[] => {
    const userPermissions = permissions
      .filter(p => p.comercial_id === userId)
      .flatMap(p => p.puede_ver_contactos_de);
    
    console.log(`📋 User ${userId} can see contacts from:`, userPermissions);
    return userPermissions;
  }, [permissions]);

  const getPermissionsForUser = useCallback((userId: string): Permission[] => {
    return permissions.filter(p => p.comercial_id === userId);
  }, [permissions]);

  const getAllPermissions = useCallback((): Permission[] => {
    return permissions;
  }, [permissions]);

  return {
    permissions,
    hierarchies,
    grantPermission,
    revokePermission,
    hasPermission,
    hasPermissionWithHierarchy,
    getUserPermissions,
    getPermissionsForUser,
    getAllPermissions,
    // Nuevas funciones de jerarquía
    assignComercialToJefe,
    removeComercialFromJefe,
    getComercialJefe,
    getJefeSubordinados
  };
}