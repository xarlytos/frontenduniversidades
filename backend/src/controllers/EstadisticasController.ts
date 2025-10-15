import { Response } from 'express';
import { Contacto } from '../models/Contacto';
import { Universidad } from '../models/Universidad';
import { Titulacion } from '../models/Titulacion';
import { AuthRequest } from '../types';
import { ContactosController } from './ContactosController';
import { RolUsuario } from '../models/Usuario';

export class EstadisticasController {
  // GET /estadisticas/total
  static async getTotal(req: AuthRequest, res: Response) {
    try {
      let filtros = {};
      
      // Aplicar visibilidad según rol
      if (req.user!.rol !== RolUsuario.ADMIN) {
        const contactosVisibles = await ContactosController.getContactosVisibles(req.user!.userId, req.user!.rol);
        filtros = { _id: { $in: contactosVisibles } };
      }

      const totalContactos = await Contacto.countDocuments(filtros);

      res.json({
        success: true,
        data: {
          totalContactos
        }
      });
    } catch (error) {
      console.error('Error obteniendo total:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /estadisticas/universidades
  static async getPorUniversidades(req: AuthRequest, res: Response) {
    try {
      let matchStage = {};
      
      // Aplicar visibilidad según rol
      if (req.user!.rol !== RolUsuario.ADMIN) {
        const contactosVisibles = await ContactosController.getContactosVisibles(req.user!.userId, req.user!.rol);
        matchStage = { _id: { $in: contactosVisibles.map(id => id) } };
      }

      const estadisticas = await Contacto.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'universidades',
            localField: 'universidadId',
            foreignField: '_id',
            as: 'universidad'
          }
        },
        { $unwind: '$universidad' },
        {
          $group: {
            _id: '$universidadId',
            universidad: { $first: '$universidad.nombre' },
            total: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ]);

      res.json({
        success: true,
        data: estadisticas.map(item => ({
          universidadId: item._id,
          universidad: item.universidad,
          total: item.total
        }))
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas por universidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /estadisticas/titulaciones
  static async getPorTitulaciones(req: AuthRequest, res: Response) {
    try {
      let matchStage = {};
      
      // Aplicar visibilidad según rol
      if (req.user!.rol !== RolUsuario.ADMIN) {
        const contactosVisibles = await ContactosController.getContactosVisibles(req.user!.userId, req.user!.rol);
        matchStage = { _id: { $in: contactosVisibles.map(id => id) } };
      }

      const estadisticas = await Contacto.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'universidades',
            localField: 'universidadId',
            foreignField: '_id',
            as: 'universidad'
          }
        },
        {
          $lookup: {
            from: 'titulaciones',
            localField: 'titulacionId',
            foreignField: '_id',
            as: 'titulacion'
          }
        },
        { $unwind: '$universidad' },
        { $unwind: '$titulacion' },
        {
          $group: {
            _id: {
              universidadId: '$universidadId',
              titulacionId: '$titulacionId',
              curso: '$curso'
            },
            universidad: { $first: '$universidad.nombre' },
            titulacion: { $first: '$titulacion.nombre' },
            total: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: {
              universidadId: '$_id.universidadId',
              titulacionId: '$_id.titulacionId'
            },
            universidad: { $first: '$universidad' },
            titulacion: { $first: '$titulacion' },
            total: { $sum: '$total' },
            porCurso: {
              $push: {
                curso: '$_id.curso',
                total: '$total'
              }
            }
          }
        },
        {
          $sort: {
            universidad: 1,
            titulacion: 1
          }
        }
      ]);

      res.json({
        success: true,
        data: estadisticas.map(item => ({
          universidadId: item._id.universidadId,
          titulacionId: item._id.titulacionId,
          universidad: item.universidad,
          titulacion: item.titulacion,
          total: item.total,
          porCurso: item.porCurso.reduce((acc: any, curr: any) => {
            acc[curr.curso] = curr.total;
            return acc;
          }, {})
        }))
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas por titulación:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /estadisticas/resumen
  static async getResumen(req: AuthRequest, res: Response) {
    try {
      const [total, porUniversidades, porTitulaciones] = await Promise.all([
        EstadisticasController.getTotal(req, { json: () => {} } as any),
        EstadisticasController.getPorUniversidades(req, { json: () => {} } as any),
        EstadisticasController.getPorTitulaciones(req, { json: () => {} } as any)
      ]);

      // Nota: Esta implementación necesita ser refinada para manejar las respuestas correctamente
      res.json({
        success: true,
        data: {
          total,
          porUniversidades,
          porTitulaciones
        }
      });
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}