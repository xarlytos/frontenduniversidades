import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario, EstadoUsuario } from '../models/Usuario';
import { config } from '../config/environment';
import { JWTPayload, AuthRequest } from '../types';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
      return;
    }

    // Usar la configuración centralizada para JWT_SECRET
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Verificar que el usuario aún existe y está activo
    const usuario = await Usuario.findById(decoded.userId);

    if (!usuario || usuario.estado !== EstadoUsuario.ACTIVO) {
      res.status(401).json({ 
        success: false, 
        message: 'Token inválido o usuario inactivo' 
      });
      return;
    }

    // Establecer información del usuario en el request
    req.user = {
      userId: usuario._id.toString(),
      email: usuario.email,
      rol: usuario.rol
    };
    
    console.log('🔍 Usuario autenticado:', {
      userId: req.user.userId,
      email: req.user.email,
      rol: req.user.rol
    });
    
    next();
  } catch (error) {
    console.error('❌ Token validation error:', error);
    res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Middleware opcional para rutas que pueden funcionar con o sin autenticación
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      const usuario = await Usuario.findById(decoded.userId)
        .populate('permisos')
        .populate('jerarquia');
      
      if (usuario && usuario.estado === EstadoUsuario.ACTIVO) {
        req.user = {
          userId: usuario._id.toString(),
          email: usuario.email,
          rol: usuario.rol
        };
      }
    }
    
    next();
  } catch (error) {
    // En caso de error, continúa sin usuario autenticado
    next();
  }
};