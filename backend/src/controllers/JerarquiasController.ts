import { Response } from 'express';
import { JerarquiaUsuarios } from '../models/JerarquiaUsuarios';
import { Usuario } from '../models/Usuario';
import { AuditLog } from '../models/AuditLog';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

export class JerarquiasController {
  // Obtener jerarquías
  static async obtenerJerarquias(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10, usuarioSuperior } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = {};

      // Filtrar por usuario superior si se proporciona
      if (usuarioSuperior) {
        filter.usuarioSuperior = usuarioSuperior;
      }

      // Si es comercial, solo puede ver sus propias jerarquías
      if (req.user?.rol === 'comercial') {
        filter.usuarioSuperior = req.user._id;
      }

      const jerarquias = await JerarquiaUsuarios.find(filter)
        .populate('usuarioSuperior', 'nombre apellidos email rol')
        .populate('usuariosSubordinados', 'nombre apellidos email rol estado')
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await JerarquiaUsuarios.countDocuments(filter);

      res.json({
        jerarquias,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error al obtener jerarquías:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener jerarquía por ID
  static async obtenerJerarquia(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de jerarquía inválido' });
      }

      const jerarquia = await JerarquiaUsuarios.findById(id)
        .populate('usuarioSuperior', 'nombre apellidos email rol')
        .populate('usuariosSubordinados', 'nombre apellidos email rol estado');

      if (!jerarquia) {
        return res.status(404).json({ error: 'Jerarquía no encontrada' });
      }

      // Verificar permisos
      if (req.user?.rol === 'comercial' && 
          jerarquia.usuarioSuperior._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          error: 'No tienes permisos para ver esta jerarquía' 
        });
      }

      res.json(jerarquia);
    } catch (error) {
      console.error('Error al obtener jerarquía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear nueva jerarquía
  static async crearJerarquia(req: AuthRequest, res: Response) {
    try {
      const { usuarioSuperior, usuariosSubordinados, descripcion } = req.body;

      // Solo admins pueden crear jerarquías
      if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'No tienes permisos para crear jerarquías' 
        });
      }

      if (!usuarioSuperior || !usuariosSubordinados || usuariosSubordinados.length === 0) {
        return res.status(400).json({ 
          error: 'Usuario superior y usuarios subordinados son obligatorios' 
        });
      }

      // Verificar que el usuario superior existe y es comercial
      const superior = await Usuario.findById(usuarioSuperior);
      if (!superior) {
        return res.status(400).json({ error: 'Usuario superior no encontrado' });
      }

      if (superior.rol !== 'comercial') {
        return res.status(400).json({ 
          error: 'El usuario superior debe tener rol comercial' 
        });
      }

      // Verificar que los usuarios subordinados existen
      const subordinados = await Usuario.find({ 
        _id: { $in: usuariosSubordinados },
        estado: 'activo'
      });

      if (subordinados.length !== usuariosSubordinados.length) {
        return res.status(400).json({ 
          error: 'Algunos usuarios subordinados no existen o están inactivos' 
        });
      }

      // Verificar que no existe ya una jerarquía para este usuario superior
      const jerarquiaExistente = await JerarquiaUsuarios.findOne({ usuarioSuperior });
      if (jerarquiaExistente) {
        return res.status(400).json({ 
          error: 'Ya existe una jerarquía para este usuario superior' 
        });
      }

      // Crear jerarquía
      const nuevaJerarquia = new JerarquiaUsuarios({
        usuarioSuperior,
        usuariosSubordinados,
        descripcion,
        creadoPor: req.user._id
      });

      await nuevaJerarquia.save();

      // Registrar en auditoría
      await AuditLog.create({
        usuario: req.user._id,
        accion: 'crear_jerarquia',
        entidad: 'JerarquiaUsuarios',
        entidadId: nuevaJerarquia._id,
        detalles: {
          usuarioSuperior: superior.email,
          cantidadSubordinados: usuariosSubordinados.length
        }
      });

      const jerarquiaCompleta = await JerarquiaUsuarios.findById(nuevaJerarquia._id)
        .populate('usuarioSuperior', 'nombre apellidos email rol')
        .populate('usuariosSubordinados', 'nombre apellidos email rol estado');

      res.status(201).json({ 
        message: 'Jerarquía creada exitosamente',
        jerarquia: jerarquiaCompleta 
      });
    } catch (error) {
      console.error('Error al crear jerarquía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar jerarquía
  static async actualizarJerarquia(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { usuariosSubordinados, descripcion } = req.body;

      // Solo admins pueden actualizar jerarquías
      if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'No tienes permisos para actualizar jerarquías' 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de jerarquía inválido' });
      }

      const jerarquia = await JerarquiaUsuarios.findById(id);
      if (!jerarquia) {
        return res.status(404).json({ error: 'Jerarquía no encontrada' });
      }

      // Guardar datos anteriores para auditoría
      const subordinadosAnteriores = [...jerarquia.usuariosSubordinados];

      // Verificar usuarios subordinados si se proporcionaron
      if (usuariosSubordinados) {
        const subordinados = await Usuario.find({ 
          _id: { $in: usuariosSubordinados },
          estado: 'activo'
        });

        if (subordinados.length !== usuariosSubordinados.length) {
          return res.status(400).json({ 
            error: 'Algunos usuarios subordinados no existen o están inactivos' 
          });
        }

        jerarquia.usuariosSubordinados = usuariosSubordinados;
      }

      if (descripcion !== undefined) {
        jerarquia.descripcion = descripcion;
      }

      jerarquia.fechaActualizacion = new Date();
      await jerarquia.save();

      // Registrar en auditoría
      await AuditLog.create({
        usuario: req.user._id,
        accion: 'actualizar_jerarquia',
        entidad: 'JerarquiaUsuarios',
        entidadId: jerarquia._id,
        detalles: {
          subordinadosAnteriores: subordinadosAnteriores.length,
          subordinadosNuevos: jerarquia.usuariosSubordinados.length,
          cambiosEnSubordinados: usuariosSubordinados ? true : false
        }
      });

      const jerarquiaActualizada = await JerarquiaUsuarios.findById(id)
        .populate('usuarioSuperior', 'nombre apellidos email rol')
        .populate('usuariosSubordinados', 'nombre apellidos email rol estado');

      res.json({ 
        message: 'Jerarquía actualizada exitosamente',
        jerarquia: jerarquiaActualizada 
      });
    } catch (error) {
      console.error('Error al actualizar jerarquía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar jerarquía
  static async eliminarJerarquia(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Solo admins pueden eliminar jerarquías
      if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'No tienes permisos para eliminar jerarquías' 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de jerarquía inválido' });
      }

      const jerarquia = await JerarquiaUsuarios.findById(id)
        .populate('usuarioSuperior', 'email');

      if (!jerarquia) {
        return res.status(404).json({ error: 'Jerarquía no encontrada' });
      }

      await JerarquiaUsuarios.findByIdAndDelete(id);

      // Registrar en auditoría
      await AuditLog.create({
        usuario: req.user._id,
        accion: 'eliminar_jerarquia',
        entidad: 'JerarquiaUsuarios',
        entidadId: jerarquia._id,
        detalles: {
          usuarioSuperior: jerarquia.usuarioSuperior.email,
          cantidadSubordinados: jerarquia.usuariosSubordinados.length
        }
      });

      res.json({ message: 'Jerarquía eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar jerarquía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Agregar usuario a jerarquía
  static async agregarUsuarioAJerarquia(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { usuarioId } = req.body;

      // Solo admins pueden modificar jerarquías
      if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar jerarquías' 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      const jerarquia = await JerarquiaUsuarios.findById(id);
      if (!jerarquia) {
        return res.status(404).json({ error: 'Jerarquía no encontrada' });
      }

      // Verificar que el usuario existe y está activo
      const usuario = await Usuario.findOne({ _id: usuarioId, estado: 'activo' });
      if (!usuario) {
        return res.status(400).json({ 
          error: 'Usuario no encontrado o inactivo' 
        });
      }

      // Verificar que el usuario no esté ya en la jerarquía
      if (jerarquia.usuariosSubordinados.includes(usuarioId)) {
        return res.status(400).json({ 
          error: 'El usuario ya está en esta jerarquía' 
        });
      }

      // Agregar usuario
      jerarquia.usuariosSubordinados.push(usuarioId);
      jerarquia.fechaActualizacion = new Date();
      await jerarquia.save();

      // Registrar en auditoría
      await AuditLog.create({
        usuario: req.user._id,
        accion: 'agregar_usuario_jerarquia',
        entidad: 'JerarquiaUsuarios',
        entidadId: jerarquia._id,
        detalles: {
          usuarioAgregado: usuario.email
        }
      });

      res.json({ message: 'Usuario agregado a la jerarquía exitosamente' });
    } catch (error) {
      console.error('Error al agregar usuario a jerarquía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Remover usuario de jerarquía
  static async removerUsuarioDeJerarquia(req: AuthRequest, res: Response) {
    try {
      const { id, usuarioId } = req.params;

      // Solo admins pueden modificar jerarquías
      if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'No tienes permisos para modificar jerarquías' 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(usuarioId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      const jerarquia = await JerarquiaUsuarios.findById(id);
      if (!jerarquia) {
        return res.status(404).json({ error: 'Jerarquía no encontrada' });
      }

      // Verificar que el usuario está en la jerarquía
      if (!jerarquia.usuariosSubordinados.includes(usuarioId)) {
        return res.status(400).json({ 
          error: 'El usuario no está en esta jerarquía' 
        });
      }

      // Obtener datos del usuario para auditoría
      const usuario = await Usuario.findById(usuarioId, 'email');

      // Remover usuario
      jerarquia.usuariosSubordinados = jerarquia.usuariosSubordinados.filter(
        uid => uid.toString() !== usuarioId
      );
      jerarquia.fechaActualizacion = new Date();
      await jerarquia.save();

      // Registrar en auditoría
      await AuditLog.create({
        usuario: req.user._id,
        accion: 'remover_usuario_jerarquia',
        entidad: 'JerarquiaUsuarios',
        entidadId: jerarquia._id,
        detalles: {
          usuarioRemovido: usuario?.email || usuarioId
        }
      });

      res.json({ message: 'Usuario removido de la jerarquía exitosamente' });
    } catch (error) {
      console.error('Error al remover usuario de jerarquía:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener subordinados de un usuario
  static async obtenerSubordinados(req: AuthRequest, res: Response) {
    try {
      const { usuarioId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(usuarioId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      // Verificar permisos
      if (req.user?.rol === 'comercial' && req.user._id.toString() !== usuarioId) {
        return res.status(403).json({ 
          error: 'No tienes permisos para ver subordinados de otros usuarios' 
        });
      }

      const jerarquia = await JerarquiaUsuarios.findOne({ usuarioSuperior: usuarioId })
        .populate('usuariosSubordinados', 'nombre apellidos email rol estado');

      if (!jerarquia) {
        return res.json({ subordinados: [] });
      }

      res.json({ subordinados: jerarquia.usuariosSubordinados });
    } catch (error) {
      console.error('Error al obtener subordinados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}