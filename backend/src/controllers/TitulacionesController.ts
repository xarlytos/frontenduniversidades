import { Response } from 'express';
import { Titulacion } from '../models/Titulacion';
import { Universidad } from '../models/Universidad';
import { AuthRequest } from '../types';
import { AuditLog, AccionAudit, EntidadAudit } from '../models/AuditLog';
import { RolUsuario } from '../models/Usuario';
import mongoose from 'mongoose';

export class TitulacionesController {
  // Obtener todas las titulaciones
  static async obtenerTitulaciones(req: AuthRequest, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        universidad,
        tipo,
        estado 
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = {};

      // Aplicar filtros
      if (search) {
        filter.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { codigo: { $regex: search, $options: 'i' } }
        ];
      }

      if (universidad) filter.universidadId = universidad;
      if (tipo) filter.tipo = tipo;
      if (estado) filter.estado = estado;

      const titulaciones = await Titulacion.find(filter)
        .populate('universidadId', 'nombre codigo')
        .sort({ nombre: 1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Titulacion.countDocuments(filter);

      res.json({
        titulaciones,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error al obtener titulaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener titulación por ID
  static async obtenerTitulacion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de titulación inválido' });
      }

      const titulacion = await Titulacion.findById(id)
        .populate('universidadId', 'nombre codigo');

      if (!titulacion) {
        return res.status(404).json({ error: 'Titulación no encontrada' });
      }

      res.json(titulacion);
    } catch (error) {
      console.error('Error al obtener titulación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear nueva titulación
  static async crearTitulacion(req: AuthRequest, res: Response) {
    try {
      const {
        nombre,
        codigo,
        universidadId,
        tipo = 'grado',
        duracion,
        creditos,
        modalidad,
        descripcion,
        activa = true
      } = req.body;
  
      // Add null check for req.user
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: 'Usuario no autenticado' 
        });
      }
  
      // Cambiar validación de rol por permisos
      // if (req.user?.rol !== 'ADMIN') {
      //   return res.status(403).json({ 
      //     error: 'No tienes permisos para crear titulaciones' 
      //   });
      // }
  
      // Validaciones
      if (!nombre || !codigo || !universidadId) {
        return res.status(400).json({ 
          success: false,
          error: 'Nombre, código y universidad son obligatorios' 
        });
      }
  
      // Verificar que la universidad existe
      const universidadExiste = await Universidad.findById(universidadId);
      if (!universidadExiste) {
        return res.status(400).json({ error: 'Universidad no encontrada' });
      }
  
      // Verificar que el código no exista en la misma universidad
      const titulacionExistente = await Titulacion.findOne({ 
        codigo, 
        universidadId 
      });
      if (titulacionExistente) {
        return res.status(400).json({ 
          error: 'Ya existe una titulación con este código en esta universidad' 
        });
      }
  
      // Create titulación with proper null check
      const nuevaTitulacion = new Titulacion({
        nombre,
        codigo,
        universidadId,
        tipo: tipo?.toLowerCase() || 'grado',
        duracion,
        creditos,
        modalidad: modalidad?.toLowerCase(),
        descripcion,
        estado: activa ? 'activa' : 'inactiva',
        creadoPor: new mongoose.Types.ObjectId(req.user.userId) // Now safe to access
      });
  
      await nuevaTitulacion.save();
  
      // Register audit with proper null check
      await AuditLog.create({
        usuarioId: new mongoose.Types.ObjectId(req.user.userId), // Now safe to access
        accion: AccionAudit.CREATE,
        entidad: EntidadAudit.TITULACION,
        entidadId: nuevaTitulacion._id.toString(),
        despues: {
          nombre: nuevaTitulacion.nombre,
          codigo: nuevaTitulacion.codigo,
          universidad: universidadExiste.nombre,
          tipo: nuevaTitulacion.tipo
        }
      });
  
      const titulacionCompleta = await Titulacion.findById(nuevaTitulacion._id)
        .populate('universidadId', 'nombre codigo');

      // Corregir estructura de respuesta
      res.status(201).json({ 
        success: true,
        message: 'Titulación creada exitosamente',
        data: titulacionCompleta 
      });
    } catch (error) {
      console.error('Error al crear titulación:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Actualizar titulación
  static async actualizarTitulacion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        nombre,
        codigo,
        universidadId,
        tipo,
        duracion,
        creditos,
        modalidad,
        descripcion,
        estado
      } = req.body;

      // Add null check for req.user
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: 'Usuario no autenticado' 
        });
      }
  
      // Cambiar validación de rol por permisos
      // if (req.user?.rol !== 'ADMIN') {
      //   return res.status(403).json({ 
      //     error: 'No tienes permisos para actualizar titulaciones' 
      //   });
      // }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de titulación inválido' });
      }

      const titulacion = await Titulacion.findById(id);
      if (!titulacion) {
        return res.status(404).json({ error: 'Titulación no encontrada' });
      }

      // Verificar universidad si se está cambiando
      if (universidadId && universidadId !== titulacion.universidadId.toString()) {
        const universidadExiste = await Universidad.findById(universidadId);
        if (!universidadExiste) {
          return res.status(400).json({ error: 'Universidad no encontrada' });
        }
      }

      // Verificar código único si se está cambiando
      if (codigo && (codigo !== titulacion.codigo || 
          (universidadId && universidadId !== titulacion.universidadId.toString()))) {
        const codigoExistente = await Titulacion.findOne({ 
          codigo, 
          universidadId: universidadId || titulacion.universidadId,
          _id: { $ne: id } 
        });
        if (codigoExistente) {
          return res.status(400).json({ 
            error: 'Ya existe una titulación con este código en esta universidad' 
          });
        }
      }

      // Guardar datos anteriores para auditoría
      const datosAnteriores = {
        nombre: titulacion.nombre,
        codigo: titulacion.codigo,
        tipo: titulacion.tipo,
        estado: titulacion.estado
      };

      // Actualizar campos
      if (nombre) titulacion.nombre = nombre;
      if (codigo) titulacion.codigo = codigo;
      if (universidadId) titulacion.universidadId = new mongoose.Types.ObjectId(universidadId);
      if (tipo) titulacion.tipo = tipo.toLowerCase();
      if (duracion) titulacion.duracion = duracion;
      if (creditos) titulacion.creditos = creditos;
      if (modalidad) titulacion.modalidad = modalidad.toLowerCase();
      if (descripcion) titulacion.descripcion = descripcion;
      if (estado) titulacion.estado = estado;

      titulacion.fechaActualizacion = new Date();
      await titulacion.save();

      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: new mongoose.Types.ObjectId(req.user.userId), // Now safe
        accion: AccionAudit.UPDATE,
        entidad: EntidadAudit.TITULACION,
        entidadId: titulacion._id.toString(),
        antes: datosAnteriores,
        despues: {
          nombre: titulacion.nombre,
          codigo: titulacion.codigo,
          tipo: titulacion.tipo,
          estado: titulacion.estado
        }
      });

      const titulacionActualizada = await Titulacion.findById(id)
        .populate('universidadId', 'nombre codigo');

      // Corregir estructura de respuesta
      res.json({ 
        success: true,
        message: 'Titulación actualizada exitosamente',
        data: titulacionActualizada 
      });
    } catch (error) {
      console.error('Error al actualizar titulación:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Eliminar titulación (soft delete)
  static async eliminarTitulacion(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Add null check for req.user
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Usuario no autenticado' 
        });
      }

      // Solo admins pueden eliminar titulaciones
      if (req.user?.rol !== 'ADMIN') {
        return res.status(403).json({ 
          error: 'No tienes permisos para eliminar titulaciones' 
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'ID de titulación inválido' });
      }

      const titulacion = await Titulacion.findById(id)
        .populate('universidadId', 'nombre');
      if (!titulacion) {
        return res.status(404).json({ error: 'Titulación no encontrada' });
      }

      // Soft delete
      titulacion.estado = 'inactiva';
      titulacion.fechaActualizacion = new Date();
      await titulacion.save();

      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: new mongoose.Types.ObjectId(req.user.userId), // Now safe
        accion: AccionAudit.DELETE,
        entidad: EntidadAudit.TITULACION,
        entidadId: titulacion._id.toString(),
        antes: {
          nombre: titulacion.nombre,
          codigo: titulacion.codigo,
          universidad: (titulacion.universidadId as any).nombre,
          estado: 'activa'
        }
      });

      res.json({ message: 'Titulación eliminada exitosamente' });
    } catch (error) {
      console.error('Error al eliminar titulación:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener titulaciones por universidad
  static async obtenerTitulacionesPorUniversidad(req: AuthRequest, res: Response) {
    try {
      const { universidadId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(universidadId)) {
        return res.status(400).json({ error: 'ID de universidad inválido' });
      }

      const titulaciones = await Titulacion.find({ 
        universidadId: universidadId,
        estado: 'activa'
      })
        .select('nombre codigo tipo duracion modalidad')
        .sort({ nombre: 1 });

      res.json(titulaciones);
    } catch (error) {
      console.error('Error al obtener titulaciones por universidad:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener titulaciones activas (para selects)
  static async obtenerTitulacionesActivas(req: AuthRequest, res: Response) {
    try {
      const { universidad } = req.query;
      const filter: any = { estado: 'activa' };
      
      if (universidad) {
        filter.universidadId = universidad;
      }

      const titulaciones = await Titulacion.find(filter)
        .populate('universidadId', 'nombre codigo')
        .select('nombre codigo tipo universidadId')
        .sort({ nombre: 1 });

      res.json(titulaciones);
    } catch (error) {
      console.error('Error al obtener titulaciones activas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener estadísticas de titulaciones
  static async obtenerEstadisticasTitulaciones(req: AuthRequest, res: Response) {
    try {
      const stats = await Titulacion.aggregate([
        {
          $group: {
            _id: '$tipo',
            total: { $sum: 1 },
            activas: {
              $sum: {
                $cond: [{ $eq: ['$estado', 'activa'] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const totalTitulaciones = await Titulacion.countDocuments();
      const titulacionesActivas = await Titulacion.countDocuments({ estado: 'activa' });

      res.json({
        total: totalTitulaciones,
        activas: titulacionesActivas,
        porTipo: stats
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de titulaciones:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Buscar titulación por nombre y universidad
  static async buscarPorNombre(req: AuthRequest, res: Response) {
    try {
      const { universidadId, nombre } = req.query;
      
      if (!universidadId || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Universidad ID y nombre son requeridos'
        });
      }
      
      const titulacion = await Titulacion.findOne({
        universidadId: universidadId,
        nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
        estado: 'activa'
      });
      
      if (!titulacion) {
        return res.status(404).json({
          success: false,
          message: 'Titulación no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: {
          _id: titulacion._id,
          nombre: titulacion.nombre,
          universidadId: titulacion.universidadId
        }
      });
    } catch (error) {
      console.error('Error buscando titulación por nombre:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}