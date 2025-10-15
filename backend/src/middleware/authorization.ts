import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UsuarioPermiso } from '../models/UsuarioPermiso';
import { Permiso } from '../models/Permiso';
import { RolUsuario } from '../models/Usuario';

// Middleware para verificar roles específicos
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Autenticación requerida' 
      });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para acceder a este recurso' 
      });
      return;
    }

    next();
  };
};

// Middleware para verificar permisos específicos
export const requirePermission = (permissionName: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          message: 'Autenticación requerida' 
        });
        return;
      }

      // Los administradores tienen todos los permisos
      if (req.user.rol === RolUsuario.ADMIN) {
        next();
        return;
      }

      // Verificar si el usuario tiene el permiso específico
      const permiso = await Permiso.findOne({ clave: permissionName });
      if (!permiso) {
        res.status(500).json({ 
          success: false, 
          message: 'Permiso no encontrado en el sistema' 
        });
        return;
      }

      const usuarioPermiso = await UsuarioPermiso.findOne({
        usuarioId: req.user.userId, // Cambiado de 'usuario' a 'usuarioId'
        permisoId: permiso._id       // Cambiado de 'permiso' a 'permisoId'
        // Removido 'activo: true' ya que no existe en el modelo
      });

      if (!usuarioPermiso) {
        res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para realizar esta acción' 
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error al verificar permisos' 
      });
    }
  };
};

// Middleware para verificar múltiples permisos (OR logic)
export const requireAnyPermission = (permissionNames: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          success: false, 
          message: 'Autenticación requerida' 
        });
        return;
      }

      // Los administradores tienen todos los permisos
      if (req.user.rol === RolUsuario.ADMIN) {
        next();
        return;
      }

      // Verificar si el usuario tiene al menos uno de los permisos
      const permisos = await Permiso.find({ clave: { $in: permissionNames } });
      const permisoIds = permisos.map(p => p._id);

      const usuarioPermiso = await UsuarioPermiso.findOne({
        usuarioId: req.user.userId,    // Cambiado de 'usuario' a 'usuarioId'
        permisoId: { $in: permisoIds } // Cambiado de 'permiso' a 'permisoId'
        // Removido 'activo: true' ya que no existe en el modelo
      });

      if (!usuarioPermiso) {
        res.status(403).json({ 
          success: false, 
          message: 'No tienes permisos para realizar esta acción' 
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Error al verificar permisos' 
      });
    }
  };
};

// Middleware para verificar que el usuario puede acceder a contactos específicos
export const checkContactAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Autenticación requerida' 
      });
      return;
    }

    // Los administradores pueden acceder a todos los contactos
    if (req.user.rol === RolUsuario.ADMIN) {
      next();
      return;
    }

    // Para usuarios comerciales, verificar jerarquía
    if (req.user.rol === RolUsuario.COMERCIAL) {
      // Este middleware se puede usar en rutas específicas donde se necesite
      // verificar acceso a contactos basado en jerarquía
      (req.user as any).canAccessAllContacts = false;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error al verificar acceso a contactos' 
    });
  }
};