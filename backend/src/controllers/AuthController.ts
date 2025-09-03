import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario, RolUsuario } from '../models/Usuario';
import { UsuarioPermiso } from '../models/UsuarioPermiso';
import { Permiso } from '../models/Permiso';
import { AuthRequest } from '../types';

export class AuthController {
  // POST /auth/login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      console.log('🔍 Login attempt:', { email, passwordProvided: !!password });

      if (!email || !password) {
        console.log('❌ Missing credentials');
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario
      const usuario = await Usuario.findOne({ 
        email: email.toLowerCase(),
        estado: 'ACTIVO'
      });
      console.log('🔍 Usuario encontrado:', usuario ? { id: usuario._id, email: usuario.email, rol: usuario.rol } : 'No encontrado');

      if (!usuario) {
        console.log('❌ Usuario no encontrado o inactivo');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await usuario.comparePassword(password);
      console.log('🔍 Password validation:', isValidPassword);
      if (!isValidPassword) {
        console.log('❌ Contraseña inválida');
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Obtener permisos efectivos
      const permisos = await AuthController.getPermisosEfectivos(usuario._id);
      console.log('🔍 Permisos obtenidos:', permisos);
      console.log('🔍 Cantidad de permisos:', permisos ? permisos.length : 0);

      // Actualizar último acceso
      usuario.ultimoAccesoAt = new Date();
      await usuario.save();

      // Generar JWT
      const token = jwt.sign(
        {
          userId: usuario._id,
          email: usuario.email,
          rol: usuario.rol
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
      );

      const responseData = {
        success: true,
        data: {
          token,
          usuario: {
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            activo: usuario.estado === 'ACTIVO',
            createdAt: usuario.createdAt,
            updatedAt: usuario.updatedAt
          },
          permisos
        }
      };
      console.log('✅ Login exitoso, enviando respuesta:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // POST /auth/logout
  static async logout(req: Request, res: Response) {
    try {
      // En una implementación con refresh tokens, aquí invalidaríamos el token
      res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /auth/me
  static async me(req: AuthRequest, res: Response) {
    try {
      const usuario = await Usuario.findById(req.user?.userId).select('-passwordHash');
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
  
      // ✅ Actualizar último acceso también en verificación automática
      usuario.ultimoAccesoAt = new Date();
      await usuario.save();
  
      const permisos = await AuthController.getPermisosEfectivos(usuario._id);
  
      res.status(200).json({
        success: true,
        data: {
          usuario: {
            _id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            estado: usuario.estado,
            createdAt: usuario.createdAt,
            updatedAt: usuario.updatedAt,
            ultimoAccesoAt: usuario.ultimoAccesoAt  // ✅ Incluir el campo
          },
          permisos
        }
      });
    } catch (error) {
      console.error('Error en me:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Método auxiliar para obtener permisos efectivos
  static async getPermisosEfectivos(usuarioId: string): Promise<string[]> {
    try {
      console.log('🔍 getPermisosEfectivos - usuarioId:', usuarioId);
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {
        console.log('❌ Usuario no encontrado en getPermisosEfectivos');
        return [];
      }
      console.log('🔍 Usuario encontrado - rol:', usuario.rol);

      // Los administradores tienen todos los permisos
      if (usuario.rol === RolUsuario.ADMIN) {
        console.log('🔍 Usuario es ADMIN, obteniendo todos los permisos');
        const todosLosPermisos = await Permiso.find({});
        console.log('🔍 Permisos encontrados para ADMIN:', todosLosPermisos.length);
        const permisosClaves = todosLosPermisos.map(p => p.clave);
        console.log('🔍 Claves de permisos para ADMIN:', permisosClaves);
        return permisosClaves;
      }

      // Para comerciales, obtener permisos específicos asignados
      console.log('🔍 Usuario no es ADMIN, buscando permisos específicos');
      const usuarioPermisos = await UsuarioPermiso.find({ usuarioId })
        .populate('permisoId');
      console.log('🔍 UsuarioPermisos encontrados:', usuarioPermisos.length);
      console.log('🔍 Detalles de UsuarioPermisos:', usuarioPermisos.map(up => ({
        id: up._id,
        usuarioId: up.usuarioId,
        permisoId: up.permisoId,
        permisoClave: (up.permisoId as any)?.clave
      })));
      
      const permisosClaves = usuarioPermisos.map(up => (up.permisoId as any).clave);
      console.log('🔍 Claves de permisos finales:', permisosClaves);
      return permisosClaves;
    } catch (error) {
      console.error('❌ Error obteniendo permisos:', error);
      return [];
    }
  }
}