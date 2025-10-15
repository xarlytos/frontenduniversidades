import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Usuario, EstadoUsuario, RolUsuario, IUsuario } from '../models/Usuario';
import { UsuarioPermiso } from '../models/UsuarioPermiso';
import { Permiso } from '../models/Permiso';
import { JerarquiaUsuarios } from '../models/JerarquiaUsuarios'; // RESTAURADO
import { AuditLog, EntidadAudit, AccionAudit } from '../models/AuditLog';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

export class UsuariosController {
  // GET /usuarios
  static async obtenerUsuarios(req: AuthRequest, res: Response) {
    try {
      console.log('📥 obtenerUsuarios - Datos recibidos:', {
        query: req.query,
        user: req.user ? { userId: req.user.userId, rol: req.user.rol } : 'No user'
      });
      
      const { page = 1, limit, search, rol, estado } = req.query;
      console.log('🔍 Parámetros de búsqueda:', { page, limit, search, rol, estado });
      
      const filter: any = {
        rol: 'COMERCIAL' // Solo mostrar usuarios comerciales
      };
      
      if (search) {
        filter.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Nota: Se ignoran los filtros de rol y estado del query para forzar solo COMERCIAL
      if (estado) filter.estado = estado;
      
      console.log('🎯 Filtro aplicado (solo COMERCIAL):', filter);
      
      let query = Usuario.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 });
      
      // Solo aplicar limit y skip si se especifica un límite
      if (limit) {
        query = query
          .limit(Number(limit) * 1)
          .skip((Number(page) - 1) * Number(limit));
      }
      
      const usuarios = await query;

      const total = await Usuario.countDocuments(filter);
      console.log('👥 Usuarios encontrados:', usuarios.length, 'de', total, 'total');
      
      // Obtener permisos para cada usuario
      console.log('🔑 Obteniendo permisos para cada usuario...');
      const usuariosConPermisos = await Promise.all(
        usuarios.map(async (usuario) => {
          const permisos = await UsuariosController.obtenerPermisosEfectivosInterno(usuario._id);
          console.log(`🔑 Usuario ${usuario.nombre} (${usuario.rol}):`, permisos.length, 'permisos');
          return {
            ...usuario.toObject(),
            permisos
          };
        })
      );
      
      const response = {
        success: true,
        usuarios: usuariosConPermisos,
        pagination: {
          page: Number(page),
          limit: limit ? Number(limit) : total,
          total,
          pages: limit ? Math.ceil(total / Number(limit)) : 1
        }
      };
      
      console.log('📤 Respuesta enviada:', {
        success: response.success,
        usuariosCount: response.usuarios.length,
        pagination: response.pagination
      });
      
      res.json(response);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /usuarios/todos - Obtener todos los usuarios independiente del rol
  static async obtenerTodosLosUsuarios(req: AuthRequest, res: Response) {
    try {
      console.log('📥 obtenerTodosLosUsuarios - Datos recibidos:', {
        query: req.query,
        user: req.user ? { userId: req.user.userId, rol: req.user.rol } : 'No user'
      });
      
      const { page = 1, limit, search, rol, estado } = req.query;
      console.log('🔍 Parámetros de búsqueda:', { page, limit, search, rol, estado });
      
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (rol) filter.rol = rol;
      if (estado) filter.estado = estado;
      
      console.log('🎯 Filtro aplicado (todos los roles):', filter);
      
      let query = Usuario.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 });
      
      // Solo aplicar limit y skip si se especifica un límite
      if (limit) {
        query = query
          .limit(Number(limit) * 1)
          .skip((Number(page) - 1) * Number(limit));
      }
      
      const usuarios = await query;

      const total = await Usuario.countDocuments(filter);
      console.log('👥 Usuarios encontrados:', usuarios.length, 'de', total, 'total');
      
      // Obtener permisos para cada usuario
      console.log('🔑 Obteniendo permisos para cada usuario...');
      const usuariosConPermisos = await Promise.all(
        usuarios.map(async (usuario) => {
          const permisos = await UsuariosController.obtenerPermisosEfectivosInterno(usuario._id);
          console.log(`🔑 Usuario ${usuario.nombre} (${usuario.rol}):`, permisos.length, 'permisos');
          return {
            ...usuario.toObject(),
            permisos
          };
        })
      );
      
      const response = {
        success: true,
        usuarios: usuariosConPermisos,
        pagination: {
          page: Number(page),
          limit: limit ? Number(limit) : total,
          total,
          pages: limit ? Math.ceil(total / Number(limit)) : 1
        }
      };
      
      console.log('📤 Respuesta enviada:', {
        success: response.success,
        usuariosCount: response.usuarios.length,
        pagination: response.pagination
      });
      
      res.json(response);
    } catch (error) {
      console.error('Error al obtener todos los usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /usuarios/:id
  static async obtenerUsuario(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const usuario = await Usuario.findById(id).select('-passwordHash');
      
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const permisos = await UsuariosController.obtenerPermisosEfectivosInterno(usuario._id);
      
      res.json({
        success: true,
        usuario: {
          ...usuario.toObject(),
          permisos
        }
      });
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // POST /usuarios
  static async crearUsuario(req: AuthRequest, res: Response) {
    try {
      console.log('🚀 UsuariosController.crearUsuario - Iniciando creación de usuario');
      console.log('📝 Datos recibidos:', { nombre: req.body.nombre, email: req.body.email, rol: req.body.rol, permisos: req.body.permisos });
      console.log('👤 Usuario que hace la petición:', { userId: req.user?.userId, rol: req.user?.rol });
      
      let { nombre, email, password, rol, permisos = [] } = req.body;
      
      // Si no se proporciona rol, asignar 'comercial' por defecto
      if (!rol) {
        rol = 'COMERCIAL';
        console.log('🔄 Rol no proporcionado, asignando rol por defecto: comercial');
      }
      
      // Validaciones básicas
      if (!nombre || !email || !password) {
        console.log('❌ Validación fallida - Campos requeridos faltantes');
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son requeridos'
        });
      }
      console.log('✅ Validaciones básicas pasadas');
      
      // Verificar que el email no esté en uso
      console.log('🔍 Verificando si el email ya existe:', email.toLowerCase());
      const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
      if (usuarioExistente) {
        console.log('❌ Email ya existe en la base de datos');
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
      console.log('✅ Email disponible');
      
      // Solo administradores pueden crear otros administradores
      console.log('🔐 Verificando permisos para crear rol:', rol);
      console.log('🔐 Rol del usuario actual:', req.user?.rol);
      if (rol === RolUsuario.ADMIN && req.user?.rol !== RolUsuario.ADMIN) {
        console.log('❌ Usuario sin permisos para crear administradores');
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para crear administradores'
        });
      }
      console.log('✅ Permisos verificados correctamente');
      
      // Crear usuario
      console.log('👤 Creando nuevo usuario con datos:', { nombre, email: email.toLowerCase(), rol });
      const nuevoUsuario = new Usuario({
        nombre,
        email: email.toLowerCase(),
        passwordHash: password, // Se hasheará automáticamente por el middleware
        rol,
        estado: EstadoUsuario.ACTIVO
      });
      
      await nuevoUsuario.save();
      console.log('✅ Usuario creado exitosamente con ID:', nuevoUsuario._id);
      
      // Asignar permisos solo si se proporcionan explícitamente
      console.log('🔑 Procesando permisos - Rol:', rol, 'Permisos recibidos:', permisos.length);
      let permisosAAsignar = permisos;

      // ELIMINADO: Ya no se asignan permisos básicos automáticamente a comerciales
      // Los permisos deben ser asignados explícitamente por un administrador

      // Asignar permisos solo si se proporcionan
      if (permisosAAsignar.length > 0) {
        console.log('🔑 Asignando', permisosAAsignar.length, 'permisos al usuario');
        const permisosValidos = await Permiso.find({ _id: { $in: permisosAAsignar } });
        console.log('🔑 Permisos validos encontrados:', permisosValidos.length);
        
        const usuarioPermisos = permisosValidos.map(permiso => ({
          usuarioId: nuevoUsuario._id,
          permisoId: permiso._id
        }));
        
        await UsuarioPermiso.insertMany(usuarioPermisos);
        console.log('✅ Permisos asignados correctamente');
      } else {
        console.log('ℹ️ No hay permisos para asignar - Usuario creado sin permisos');
      }
      
      // Registrar en auditoría
      console.log('📋 Registrando en auditoría');
      await AuditLog.create({
        usuarioId: req.user?.userId || req.user?._id,
        entidad: EntidadAudit.USUARIO,
        entidadId: nuevoUsuario._id.toString(),
        accion: AccionAudit.CREATE,
        despues: {
          nombre: nuevoUsuario.nombre,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Usar destructuring en lugar de delete
      const { passwordHash, ...usuarioRespuesta } = nuevoUsuario.toObject();
      
      console.log('✅ Usuario creado exitosamente:', usuarioRespuesta.nombre, '(' + usuarioRespuesta.rol + ')');
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        usuario: usuarioRespuesta
      });
    } catch (error) {
      console.error('💥 Error al crear usuario:', error);
      if (error instanceof Error) {
        console.error('💥 Stack trace:', error.stack);
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // POST /usuarios/admin - Crear usuario administrador
  static async crearAdministrador(req: AuthRequest, res: Response) {
    try {
      const { nombre, email, password } = req.body;
      
      // Validaciones básicas
      if (!nombre || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son requeridos'
        });
      }
      
      // Permitir crear administradores sin autenticación
      
      // Verificar que el email no esté en uso
      const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
      if (usuarioExistente) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está en uso'
        });
      }
      
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }
      
      // Validar contraseña (mínimo 8 caracteres)
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }
      
      // Crear usuario administrador
      const nuevoAdmin = new Usuario({
        nombre: nombre.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: password, // Se hasheará automáticamente por el middleware
        rol: RolUsuario.ADMIN,
        estado: EstadoUsuario.ACTIVO
      });
      
      await nuevoAdmin.save();
      
      // Registrar en auditoría
      // Solo registrar auditoría si hay un usuario autenticado
      if (req.user?.userId) {
        await AuditLog.create({
          usuarioId: req.user.userId,
          entidad: EntidadAudit.USUARIO,
          entidadId: nuevoAdmin._id.toString(),
          accion: AccionAudit.CREATE,
          despues: {
            administradorCreado: {
              nombre: nuevoAdmin.nombre,
              email: nuevoAdmin.email,
              rol: nuevoAdmin.rol
            }
          },
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      
      // Respuesta sin contraseña
      const { passwordHash, ...adminRespuesta } = nuevoAdmin.toObject();
      
      res.status(201).json({
        success: true,
        message: 'Administrador creado exitosamente',
        usuario: adminRespuesta
      });
    } catch (error) {
      console.error('Error al crear administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT /usuarios/:id
  static async actualizarUsuario(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nombre, email, rol, permisos } = req.body;
      
      const usuario = await Usuario.findById(id);
      console.log('🔍 Usuario encontrado:', usuario ? { id: usuario._id, email: usuario.email } : 'No encontrado');
      if (!usuario) {
        console.log('❌ Usuario no encontrado');
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Solo administradores pueden cambiar roles o modificar otros administradores
      if (req.user?.rol !== RolUsuario.ADMIN) {
        if (rol && rol !== usuario.rol) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para cambiar roles'
          });
        }
        
        if (usuario.rol === RolUsuario.ADMIN) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para modificar administradores'
          });
        }
      }
      
      const datosAnteriores = {
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      };
      
      // Actualizar campos
      if (nombre) usuario.nombre = nombre;
      if (email) {
        const emailExistente = await Usuario.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: id }
        });
        if (emailExistente) {
          return res.status(400).json({
            success: false,
            message: 'El email ya está en uso'
          });
        }
        usuario.email = email.toLowerCase();
      }
      if (rol) usuario.rol = rol;
      
      await usuario.save();
      
      // Actualizar permisos si se proporcionaron
      if (permisos !== undefined) {
        // Eliminar permisos existentes
        await UsuarioPermiso.deleteMany({ usuarioId: usuario._id });
        
        // Agregar nuevos permisos
        if (permisos.length > 0) {
          const permisosValidos = await Permiso.find({ _id: { $in: permisos } });
          
          const usuarioPermisos = permisosValidos.map(permiso => ({
            usuarioId: usuario._id,
            permisoId: permiso._id
          }));
          
          await UsuarioPermiso.insertMany(usuarioPermisos);
        }
      }
      
      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: req.user?.userId || req.user?._id,
        entidad: EntidadAudit.USUARIO,
        entidadId: usuario._id.toString(),
        accion: AccionAudit.UPDATE,
        antes: datosAnteriores,
        despues: {
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Usar destructuring en lugar de delete
      const { passwordHash, ...usuarioRespuesta } = usuario.toObject();
      
      res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        usuario: usuarioRespuesta
      });
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT /usuarios/:id/password
  static async cambiarPassword(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { passwordActual } = req.body;
      console.log('🔍 cambiarPassword - Parámetros recibidos:', { id, hasPasswordActual: !!passwordActual });
      
      if (!passwordActual) {
        console.log('❌ Nueva contraseña no proporcionada');
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña es requerida'
        });
      }
      
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const currentUserId = req.user?.userId || req.user?._id;
      console.log('🔍 Usuario actual:', { currentUserId, rol: req.user?.rol, targetId: id });
      
      // Solo administradores pueden cambiar contraseñas
      if (req.user?.rol !== RolUsuario.ADMIN) {
        console.log('❌ Sin permisos para cambiar contraseña');
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para cambiar contraseñas'
        });
      }
      
      // Actualizar contraseña
      console.log('🔍 Actualizando contraseña');
      usuario.passwordHash = passwordActual; // Se hasheará automáticamente
      await usuario.save();
      console.log('✅ Contraseña actualizada en base de datos');
      
      // Registrar en auditoría
      console.log('🔍 Registrando en auditoría');
      const auditData = {
        usuarioId: currentUserId,
        entidad: EntidadAudit.USUARIO,
        entidadId: usuario._id.toString(),
        accion: AccionAudit.UPDATE,
        despues: {
          cambiadoPor: currentUserId === id ? 'propio' : 'administrador'
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
      console.log('🔍 Datos de auditoría:', auditData);
      await AuditLog.create(auditData);
      console.log('✅ Auditoría registrada');
      
      const responseData = {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };
      console.log('✅ Enviando respuesta exitosa:', responseData);
      res.json(responseData);
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // POST /usuarios/:id/asignar-jefe
  static async asignarJefe(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // ID del subordinado
      const { usuarioId } = req.body; // ID del jefe
      
      console.log('🔗 asignarJefe - Datos recibidos:', {
        subordinadoId: id,
        usuarioId,
        user: req.user ? { userId: req.user.userId, rol: req.user.rol } : 'No user'
      });
      
      // Solo administradores pueden asignar jefes
      if (req.user?.rol !== RolUsuario.ADMIN) {
        console.log('❌ Sin permisos para asignar jefes');
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para asignar jefes'
        });
      }
      
      // Validar que se proporcione el usuarioId
      if (!usuarioId) {
        console.log('❌ usuarioId no proporcionado');
        return res.status(400).json({
          success: false,
          message: 'El ID del jefe es requerido'
        });
      }
      
      // Verificar que el subordinado exista
      const subordinado = await Usuario.findById(id);
      if (!subordinado) {
        console.log('❌ Subordinado no encontrado:', id);
        return res.status(404).json({
          success: false,
          message: 'Usuario subordinado no encontrado'
        });
      }
      
      // Verificar que el jefe exista
      const jefe = await Usuario.findById(usuarioId);
      if (!jefe) {
        console.log('❌ Jefe no encontrado:', usuarioId);
        return res.status(404).json({
          success: false,
          message: 'Usuario jefe no encontrado'
        });
      }
      
      // Validar que no se asigne a sí mismo
      if (id === usuarioId) {
        console.log('❌ Intento de auto-asignación');
        return res.status(400).json({
          success: false,
          message: 'Un usuario no puede ser jefe de sí mismo'
        });
      }
      
      // Verificar si ya existe una relación jerárquica para este subordinado
      const relacionExistente = await JerarquiaUsuarios.findOne({ subordinadoId: id });
      
      let jerarquia;
      let accion = 'crear';
      
      if (relacionExistente) {
        // Actualizar la relación existente
        console.log('🔄 Actualizando relación jerárquica existente');
        relacionExistente.jefeId = new mongoose.Types.ObjectId(usuarioId);
        jerarquia = await relacionExistente.save();
        accion = 'actualizar';
      } else {
        // Crear nueva relación jerárquica
        console.log('➕ Creando nueva relación jerárquica');
        jerarquia = new JerarquiaUsuarios({
          subordinadoId: new mongoose.Types.ObjectId(id),
          jefeId: new mongoose.Types.ObjectId(usuarioId)
        });
        await jerarquia.save();
      }
      
      // Registrar en auditoría
      console.log('📋 Registrando en auditoría');
      await AuditLog.create({
        usuarioId: req.user?.userId || req.user?._id,
        entidad: EntidadAudit.USUARIO,
        entidadId: id,
        accion: AccionAudit.UPDATE,
        despues: {
          jerarquia: {
            subordinado: { id: subordinado._id, nombre: subordinado.nombre },
            jefe: { id: jefe._id, nombre: jefe.nombre },
            accion
          }
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      console.log('✅ Jefe asignado exitosamente:', {
        subordinado: subordinado.nombre,
        jefe: jefe.nombre,
        accion
      });
      
      res.json({
        success: true,
        message: 'Jefe asignado exitosamente',
        jerarquia: {
          subordinado: {
            id: subordinado._id,
            nombre: subordinado.nombre,
            email: subordinado.email
          },
          jefe: {
            id: jefe._id,
            nombre: jefe.nombre,
            email: jefe.email
          }
        }
      });
    } catch (error) {
      console.error('💥 Error al asignar jefe:', error);
      if (error instanceof Error) {
        console.error('💥 Stack trace:', error.stack);
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // DELETE /usuarios/:id/remover-jefe
  static async removerJefe(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params; // ID del subordinado
      
      console.log('🔗 removerJefe - Datos recibidos:', {
        subordinadoId: id,
        user: req.user ? { userId: req.user.userId, rol: req.user.rol } : 'No user'
      });
      
      // Solo administradores pueden remover jefes
      if (req.user?.rol !== RolUsuario.ADMIN) {
        console.log('❌ Sin permisos para remover jefes');
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para remover jefes'
        });
      }
      
      // Verificar que el subordinado exista
      const subordinado = await Usuario.findById(id);
      if (!subordinado) {
        console.log('❌ Subordinado no encontrado:', id);
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Buscar la relación jerárquica antes de eliminarla
      const relacionExistente = await JerarquiaUsuarios.findOne({ subordinadoId: id });
      
      if (!relacionExistente) {
        console.log('❌ No se encontró relación jerárquica para:', id);
        return res.status(404).json({
          success: false,
          message: 'No se encontró una relación jerárquica para este usuario'
        });
      }
      
      // Obtener información del jefe que se va a remover
      const jefeRemovido = await Usuario.findById(relacionExistente.jefeId);
      
      // Eliminar la relación jerárquica
      await JerarquiaUsuarios.findOneAndDelete({ subordinadoId: id });
      
      // Registrar en auditoría
      console.log('📋 Registrando en auditoría');
      await AuditLog.create({
        usuarioId: req.user?.userId || req.user?._id,
        entidad: EntidadAudit.USUARIO,
        entidadId: id,
        accion: AccionAudit.UPDATE,
        despues: {
          jerarquia: {
            subordinado: { id: subordinado._id, nombre: subordinado.nombre },
            jefeRemovido: jefeRemovido ? { id: jefeRemovido._id, nombre: jefeRemovido.nombre } : null,
            accion: 'remover'
          }
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      console.log('✅ Jefe removido exitosamente:', {
        subordinado: subordinado.nombre,
        jefeRemovido: jefeRemovido?.nombre || 'Desconocido'
      });
      
      res.json({
        success: true,
        message: 'Jefe removido exitosamente',
        subordinado: {
          id: subordinado._id,
          nombre: subordinado.nombre,
          email: subordinado.email
        }
      });
    } catch (error) {
      console.error('💥 Error al remover jefe:', error);
      if (error instanceof Error) {
        console.error('💥 Stack trace:', error.stack);
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // DELETE /usuarios/:id
  static async eliminarUsuario(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      // Solo administradores pueden eliminar usuarios
      if (req.user?.rol !== RolUsuario.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar usuarios'
        });
      }
      
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const currentUserId = req.user?.userId || req.user?._id;
      
      // No permitir auto-eliminación
      if (currentUserId === id) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }
      
      // Hard delete - eliminar usuario completamente
      await Usuario.findByIdAndDelete(id);
      
      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: currentUserId,
        entidad: EntidadAudit.USUARIO,
        entidadId: usuario._id.toString(),
        accion: AccionAudit.DELETE,
        antes: {
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /usuarios/:id/permisos
  static async obtenerPermisosEfectivos(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const usuario = await Usuario.findById(id);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const permisos = await UsuariosController.obtenerPermisosEfectivosInterno(id);
      
      res.json({
        success: true,
        permisos
      });
    } catch (error) {
      console.error('Error al obtener permisos efectivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT /usuarios/:id/permisos
  static async actualizarPermisos(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { permisos } = req.body; // Array de IDs de permisos
      
      console.log('🔧 actualizarPermisos - Iniciando actualización de permisos');
      console.log('📋 ID de usuario:', id);
      console.log('🔑 Permisos recibidos:', permisos);
      
      const usuario = await Usuario.findById(id);
      console.log('👤 Usuario encontrado:', usuario ? `${usuario.nombre} (${usuario.email})` : 'No encontrado');
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir modificar permisos de administradores
      if (usuario.rol === RolUsuario.ADMIN) {
        console.log('❌ Intento de modificar permisos de administrador bloqueado');
        return res.status(400).json({
          success: false,
          message: 'No se pueden modificar los permisos de un administrador'
        });
      }
      
      console.log('✅ Usuario válido para modificación de permisos');

      // Mapear IDs del frontend a claves de permisos
      // Este mapeo debe mantenerse sincronizado con src/constants/permissions.ts
      const PERMISSION_ID_MAP: { [key: string]: string } = {
        '1': 'VER_CONTACTOS',
        '4': 'ELIMINAR_CONTACTOS',
        '7': 'GESTIONAR_USUARIOS'
      };
      
      // Convertir IDs del frontend a claves de permisos
      const claves = permisos.map((id: string) => PERMISSION_ID_MAP[id]).filter(Boolean);
      console.log('🔄 Conversión de IDs a claves:', { permisos, claves });
      
      // Validar que todos los permisos existen usando las claves
      console.log('🔍 Ejecutando consulta: Permiso.find({ clave: { $in:', claves, '} })');
      console.log('🔗 Conexión MongoDB estado:', mongoose.connection.readyState);
      
      const permisosValidos = await Permiso.find({ clave: { $in: claves } });
      console.log('🔍 Permisos válidos encontrados:', permisosValidos.length, 'de', claves.length);
      console.log('📝 Permisos válidos:', permisosValidos.map(p => ({ id: p._id, clave: p.clave })));
      
      // Debug adicional: verificar todos los permisos en la base de datos
      if (permisosValidos.length === 0) {
        console.log('🚨 No se encontraron permisos. Verificando todos los permisos en la BD...');
        const todosPermisos = await Permiso.find({});
        console.log('📊 Total permisos en BD:', todosPermisos.length);
        todosPermisos.forEach(p => console.log(`  - ${p.clave}`));
      }
      
      if (permisosValidos.length !== claves.length) {
        console.log('❌ Algunos permisos no son válidos');
        return res.status(400).json({
          success: false,
          message: 'Algunos permisos no son válidos'
        });
      }

      // Eliminar permisos actuales del usuario
      const permisosEliminados = await UsuarioPermiso.deleteMany({ usuarioId: id });
      console.log('🗑️ Permisos anteriores eliminados:', permisosEliminados.deletedCount);

      // Asignar nuevos permisos usando los ObjectIds de los permisos válidos
      if (permisosValidos.length > 0) {
        const usuarioPermisos = permisosValidos.map((permiso) => ({
          usuarioId: id,
          permisoId: permiso._id
        }));
        
        console.log('➕ Insertando nuevos permisos:', usuarioPermisos.length);
        console.log('📋 Permisos a insertar:', usuarioPermisos);
        const resultado = await UsuarioPermiso.insertMany(usuarioPermisos);
        console.log('✅ Permisos insertados exitosamente:', resultado.length);
      } else {
        console.log('ℹ️ No hay permisos para asignar (array vacío)');
      }

      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: req.user?.userId || req.user?._id,
        entidad: EntidadAudit.USUARIO,
        entidadId: id,
        accion: AccionAudit.UPDATE,
        antes: { permisos: 'permisos_anteriores' },
        despues: { permisos: permisosValidos.map(p => p.clave) }
      });

      console.log('🎉 Permisos actualizados correctamente para usuario:', id);
      res.json({
        success: true,
        message: 'Permisos actualizados correctamente'
      });
    } catch (error) {
      console.error('💥 Error al actualizar permisos:', error);
      console.error('📊 Stack trace:', error instanceof Error ? error.stack : 'No stack available');
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Función para asignar permisos básicos a comerciales existentes
  static async asignarPermisosBasicosAComerciales(req: AuthRequest, res: Response) {
    try {
      console.log('🔧 Iniciando asignación de permisos básicos a comerciales existentes');
      
      // Obtener todos los usuarios comerciales
      const comerciales = await Usuario.find({ rol: 'COMERCIAL' });
      console.log(`👥 Encontrados ${comerciales.length} usuarios comerciales`);

      // Obtener permisos básicos
      const permisosBasicos = await Permiso.find({
        clave: {
          $in: [
            'VER_CONTACTOS',
            'CREAR_CONTACTOS', 
            'EDITAR_CONTACTOS',
            'IMPORTAR_CONTACTOS',
            'EXPORTAR_CONTACTOS'
          ]
        }
      });
      
      console.log(`🔑 Encontrados ${permisosBasicos.length} permisos básicos`);

      let asignados = 0;
      let yaExistentes = 0;

      for (const comercial of comerciales) {
        console.log(`👤 Procesando usuario: ${comercial.nombre}`);
        
        for (const permiso of permisosBasicos) {
          // Verificar si ya tiene el permiso
          const existePermiso = await UsuarioPermiso.findOne({
            usuarioId: comercial._id,
            permisoId: permiso._id
          });

          if (!existePermiso) {
            // Asignar el permiso
            await UsuarioPermiso.create({
              usuarioId: comercial._id,
              permisoId: permiso._id
            });
            console.log(`  ✅ Asignado: ${permiso.clave}`);
            asignados++;
          } else {
            yaExistentes++;
          }
        }
      }

      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: req.user?.userId,
        entidad: EntidadAudit.USUARIO,
        entidadId: '',
        accion: AccionAudit.UPDATE,
        despues: {
          detalles: `Asignación masiva de permisos básicos a comerciales: ${asignados} permisos asignados`
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Permisos básicos asignados correctamente',
        data: {
          comerciales: comerciales.length,
          permisosAsignados: asignados,
          permisosYaExistentes: yaExistentes
        }
      });
      
    } catch (error) {
      console.error('❌ Error asignando permisos básicos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /usuarios/jerarquias - Obtener todas las jerarquías
  static async obtenerJerarquias(req: AuthRequest, res: Response) {
    try {
      console.log('📥 obtenerJerarquias - Datos recibidos:', {
        user: req.user ? { userId: req.user.userId, rol: req.user.rol } : 'No user'
      });
      
      // Solo administradores pueden ver todas las jerarquías
      if (req.user?.rol !== RolUsuario.ADMIN) {
        console.log('❌ Sin permisos para ver jerarquías');
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver las jerarquías'
        });
      }
      
      // Obtener todas las jerarquías con información de usuarios
      const jerarquias = await JerarquiaUsuarios.find({})
        .populate('subordinadoId', 'nombre email rol')
        .populate('jefeId', 'nombre email rol')
        .sort({ createdAt: -1 });
      
      console.log('👥 Jerarquías encontradas:', jerarquias.length);
      
      // Mapear a formato del frontend
      const jerarquiasMapeadas = jerarquias.map(jerarquia => {
        const jefe = jerarquia.jefeId as any;
        const comercial = jerarquia.subordinadoId as any;
        
        return {
          id: jerarquia._id.toString(),
          jefe_id: jefe._id.toString(),
          comercial_id: comercial._id.toString(),
          asignado_por: 'sistema', // No tenemos esta info en el modelo actual
          fecha_asignacion: jerarquia.createdAt.toISOString(),
          jefe_info: {
            id: jefe._id.toString(),
            nombre: jefe.nombre,
            email: jefe.email,
            rol: jefe.rol
          },
          comercial_info: {
            id: comercial._id.toString(),
            nombre: comercial.nombre,
            email: comercial.email,
            rol: comercial.rol
          }
        };
      });
      
      console.log('📤 Respuesta enviada:', {
        success: true,
        jerarquiasCount: jerarquiasMapeadas.length
      });
      
      res.json({
        success: true,
        jerarquias: jerarquiasMapeadas
      });
    } catch (error) {
      console.error('Error al obtener jerarquías:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Método auxiliar para obtener permisos efectivos
  private static async obtenerPermisosEfectivosInterno(usuarioId: string) {
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) return [];
      
      // Los administradores tienen todos los permisos
      if (usuario.rol === RolUsuario.ADMIN) {
        const todosLosPermisos = await Permiso.find({});
        return todosLosPermisos.map(p => p.clave);
      }
      
      // Para otros roles, obtener permisos asignados directamente
      const usuarioPermisos = await UsuarioPermiso.find({ usuarioId })
        .populate('permisoId');
      
      const permisosDirectos = usuarioPermisos.map(up => (up.permisoId as any).clave);
      
      // TODO: Agregar permisos por rol cuando se implemente
      
      return [...new Set(permisosDirectos)];
    } catch (error) {
      console.error('Error al obtener permisos efectivos:', error);
      return [];
    }
  }
}