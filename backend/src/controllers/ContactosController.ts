import { Response } from 'express';
import { Contacto } from '../models/Contacto';
import { JerarquiaUsuarios } from '../models/JerarquiaUsuarios'; // RESTAURADO
import { RolUsuario } from '../models/Usuario';
import { AuthRequest } from '../types';
import { AuditLog, AccionAudit, EntidadAudit } from '../models/AuditLog';
import { Permiso } from '../models/Permiso';
import { UsuarioPermiso } from '../models/UsuarioPermiso';


export class ContactosController {
  // GET /contactos
  static async getContactos(req: AuthRequest, res: Response) {
    try {
      const {
        universidadId,
        titulacionId,
        curso,
        q,
        page = 1,
        limit = 20,
        sortBy = 'fechaAlta',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir filtros
      const filtros: any = {};
      
      if (universidadId) filtros.universidadId = universidadId;
      if (titulacionId) filtros.titulacionId = titulacionId;
      if (curso) filtros.curso = parseInt(curso as string);
      
      if (q) {
        filtros.$or = [
          { nombreCompleto: { $regex: q, $options: 'i' } },
          { telefono: { $regex: q, $options: 'i' } },
          { instagram: { $regex: q, $options: 'i' } }
        ];
      }

      // Aplicar visibilidad según rol
      if (req.user!.rol !== RolUsuario.ADMIN) {
        const contactosVisibles = await ContactosController.getContactosVisibles(req.user!.userId, req.user!.rol);
        if (contactosVisibles.length > 0) {
          filtros._id = { $in: contactosVisibles };
        } else {
          // Si no hay contactos visibles para un comercial, no mostrar nada
          filtros._id = { $in: [] };
        }
      }
      // Para administradores, no aplicar ningún filtro de visibilidad

      // Construir ordenamiento
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Ejecutar consulta
      const [contactos, total] = await Promise.all([
        Contacto.find(filtros)
          .populate('universidadId', 'nombre')
          .populate('titulacionId', 'nombre')
          .populate('comercialId', 'nombre email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        Contacto.countDocuments(filtros)
      ]);

      res.json({
        success: true,
        data: contactos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      console.error('Error obteniendo contactos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /contactos/todos - Obtener todos los contactos sin filtros
  static async getTodosLosContactos(req: AuthRequest, res: Response) {
    try {
      // La verificación de permisos se hace en el middleware requireAnyPermission(['VER_CONTACTOS'])
      // Los administradores automáticamente tienen todos los permisos

      console.log('📊 getTodosLosContactos - Obteniendo todos los contactos para admin:', req.user!.userId);

      // Obtener todos los contactos sin filtros
      const contactos = await Contacto.find({})
        .populate('universidadId', 'nombre')
        .populate('titulacionId', 'nombre')
        .populate('comercialId', 'nombre email')
        .populate('createdBy', 'nombre email')
        .sort({ fechaAlta: -1 }); // Ordenar por fecha de alta descendente

      console.log(`📊 getTodosLosContactos - Total contactos encontrados: ${contactos.length}`);

      res.json({
        success: true,
        data: contactos,
        total: contactos.length,
        message: `Se encontraron ${contactos.length} contactos en total`
      });
    } catch (error) {
      console.error('Error obteniendo todos los contactos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // GET /contactos/:id
  static async getContacto(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const contacto = await Contacto.findById(id)
        .populate('universidadId', 'nombre')
        .populate('titulacionId', 'nombre')
        .populate('comercialId', 'nombre email')
        .populate('createdBy', 'nombre email');

      if (!contacto) {
        return res.status(404).json({
          success: false,
          message: 'Contacto no encontrado'
        });
      }

      // Verificar visibilidad
      const tieneAcceso = await ContactosController.tieneAccesoContacto(req.user!.userId, req.user!.rol, contacto._id);
      if (!tieneAcceso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este contacto'
        });
      }

      res.json({
        success: true,
        data: contacto
      });
    } catch (error) {
      console.error('Error obteniendo contacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // POST /contactos
  static async crearContacto(req: AuthRequest, res: Response) {
    try {
      // Resolver conflicto en la extracción de campos
      const {
        universidadId,
        titulacionId,
        curso,
        nombreCompleto,
        telefono,
        instagram,
        anioNacimiento,
        comercialId,
        diaLibre // ← Mantener este campo
      } = req.body;

      // Validaciones
      if (!telefono && !instagram) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar al menos teléfono o Instagram'
        });
      }

      const nuevoContacto = new Contacto({
        universidadId,
        titulacionId,
        curso,
        nombreCompleto,
        telefono,
        instagram,
        anioNacimiento,
        comercialId: comercialId || req.user!.userId,
        createdBy: req.user!.userId,
        diaLibre // ← Mantener este campo
      });

      await nuevoContacto.save();
      
      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: req.user!.userId,
        entidad: EntidadAudit.CONTACTO,
        entidadId: nuevoContacto._id,
        accion: AccionAudit.CREATE,
        despues: nuevoContacto.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      const contactoCompleto = await Contacto.findById(nuevoContacto._id)
        .populate('universidadId', 'nombre')
        .populate('titulacionId', 'nombre')
        .populate('comercialId', 'nombre email');

      res.status(201).json({
        success: true,
        data: contactoCompleto,
        message: 'Contacto creado exitosamente'
      });
    } catch (error) {
      console.error('Error creando contacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT /contactos/:id
  static async actualizarContacto(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      const contactoAnterior = await Contacto.findById(id);
      if (!contactoAnterior) {
        return res.status(404).json({
          success: false,
          message: 'Contacto no encontrado'
        });
      }

      // Verificar acceso
      const tieneAcceso = await ContactosController.tieneAccesoContacto(req.user!.userId, req.user!.rol, id);
      if (!tieneAcceso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este contacto'
        });
      }

      const contactoActualizado = await Contacto.findByIdAndUpdate(
        id,
        { ...datosActualizacion, fechaModificacion: new Date() },
        { new: true, runValidators: true }
      ).populate('universidadId', 'nombre')
       .populate('titulacionId', 'nombre')
       .populate('comercialId', 'nombre email');

      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: req.user!.userId,
        entidad: EntidadAudit.CONTACTO,
        entidadId: id,
        accion: AccionAudit.UPDATE,
        antes: contactoAnterior.toObject(),
        despues: contactoActualizado!.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: contactoActualizado,
        message: 'Contacto actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error actualizando contacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // DELETE /contactos/:id
  static async eliminarContacto(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const contacto = await Contacto.findById(id);
      if (!contacto) {
        return res.status(404).json({
          success: false,
          message: 'Contacto no encontrado'
        });
      }

      // Verificar permisos (requiere permiso específico o ser admin)
      const tienePermiso = req.user!.rol === RolUsuario.ADMIN || 
                          await ContactosController.tienePermisoEliminar(req.user!.userId);
      
      if (!tienePermiso) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar contactos'
        });
      }

      await Contacto.findByIdAndDelete(id);

      // Registrar en auditoría
      await AuditLog.create({
        usuarioId: req.user!.userId,
        entidad: EntidadAudit.CONTACTO,
        entidadId: id,
        accion: AccionAudit.DELETE,
        antes: contacto.toObject(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Contacto eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando contacto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT /contactos/:id/asignar-comercial
  static async asignarComercial(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { comercialId } = req.body;

      const contacto = await Contacto.findByIdAndUpdate(
        id,
        { comercialId, fechaModificacion: new Date() },
        { new: true }
      ).populate('comercialId', 'nombre email');

      if (!contacto) {
        return res.status(404).json({
          success: false,
          message: 'Contacto no encontrado'
        });
      }

      res.json({
        success: true,
        data: contacto,
        message: 'Comercial asignado exitosamente'
      });
    } catch (error) {
      console.error('Error asignando comercial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Métodos auxiliares
  static async getContactosVisibles(usuarioId: string, rol: string): Promise<string[]> {
    console.log(`🔍 getContactosVisibles llamada para usuario ${usuarioId} con rol ${rol}`);
    
    if (rol === RolUsuario.ADMIN) {
      console.log('👑 Usuario es ADMIN - sin filtros');
      return []; // Admin ve todos, no aplicar filtro
    }
  
  // Para comerciales, incluir sus subordinados
  const subordinados = await ContactosController.getSubordinados(usuarioId);
  const comercialesVisibles = [usuarioId, ...subordinados];
  
  console.log(`👥 Comerciales visibles para ${usuarioId}:`, comercialesVisibles);
    
  const contactos = await Contacto.find({
    $or: [
      { comercialId: { $in: comercialesVisibles } }, // Contactos asignados a él y sus subordinados
      { createdBy: usuarioId } // Contactos creados por él
    ]
  }).select('_id');
  
  console.log(`📊 Total contactos encontrados: ${contactos.length}`);
  
  return contactos.map(c => c._id.toString());
  }

  // Función para obtener subordinados recursivamente
  static async getSubordinados(jefeId: string): Promise<string[]> {
    try {
      console.log(`🔍 Buscando subordinados para jefe: ${jefeId}`);
      
      const subordinadosDirectos = await JerarquiaUsuarios.find({ jefeId }).select('subordinadoId');
      let todosLosSubordinados = subordinadosDirectos.map(s => s.subordinadoId.toString());
      
      console.log(`👥 Subordinados directos encontrados: ${todosLosSubordinados.length}`);
      
      // Recursivamente obtener subordinados de subordinados
      for (const subordinadoId of subordinadosDirectos.map(s => s.subordinadoId.toString())) {
        const subSubordinados = await ContactosController.getSubordinados(subordinadoId);
        todosLosSubordinados = [...todosLosSubordinados, ...subSubordinados];
      }
      
      const subordinadosUnicos = [...new Set(todosLosSubordinados)];
      console.log(`📊 Total subordinados (incluyendo sub-subordinados): ${subordinadosUnicos.length}`);
      
      return subordinadosUnicos;
    } catch (error) {
      console.error('❌ Error obteniendo subordinados:', error);
      return [];
    }
  }

  static async tieneAccesoContacto(usuarioId: string, rol: string, contactoId: string): Promise<boolean> {
    if (rol === RolUsuario.ADMIN) return true;
    
    const contactosVisibles = await ContactosController.getContactosVisibles(usuarioId, rol);
    return contactosVisibles.includes(contactoId);
  }

  static async tienePermisoEliminar(usuarioId: string): Promise<boolean> {
    try {
      // Buscar el permiso de eliminar contactos
      const permiso = await Permiso.findOne({ clave: 'ELIMINAR_CONTACTOS' });
      if (!permiso) {
        console.log('❌ Permiso ELIMINAR_CONTACTOS no encontrado en el sistema');
        return false;
      }
  
      // Verificar si el usuario tiene este permiso asignado
      const usuarioPermiso = await UsuarioPermiso.findOne({
        usuarioId: usuarioId,
        permisoId: permiso._id
      });
  
      return !!usuarioPermiso;
    } catch (error) {
      console.error('Error verificando permiso de eliminar:', error);
      return false;
    }
  }

  // POST /contactos/importar - Importar contactos desde JSON
  static async importarContactosJSON(req: AuthRequest, res: Response) {
    try {
      const { contactos } = req.body;
      
      // Log de depuración para ver qué datos llegan al backend
      console.log('📥 POST /api/contactos/importar - Body:', JSON.stringify(req.body, null, 2));
      console.log('📊 Número de contactos recibidos:', contactos?.length || 0);
      
      if (contactos && Array.isArray(contactos)) {
        contactos.forEach((contacto, index) => {
          console.log(`📋 Contacto ${index + 1}:`, {
            nombreCompleto: contacto.nombreCompleto,
            telefono: contacto.telefono,
            universidadId: contacto.universidadId,
            titulacionId: contacto.titulacionId,
            comercialId: contacto.comercialId
          });
        });
      }

      if (!contactos || !Array.isArray(contactos)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de contactos en el campo "contactos"'
        });
      }

      const resultados = {
        exitosos: 0,
        errores: 0,
        detalles: [] as Array<{ fila: number; error?: string; contacto?: any }>
      };

      let filaActual = 0;

      // Procesar cada contacto
      for (const data of contactos) {
        filaActual++;
        
        try {
          // Validar datos requeridos
          const erroresValidacion = [];
          
          if (!data.nombreCompleto?.trim()) {
            erroresValidacion.push('Nombre completo es requerido');
          }
          
          if (!data.telefono?.trim() && !data.instagram?.trim()) {
            erroresValidacion.push('Debe proporcionar al menos teléfono o Instagram');
          }
          
          if (!data.universidadId?.trim()) {
            erroresValidacion.push('Universidad es requerida');
          }
          
          if (!data.titulacionId?.trim()) {
            erroresValidacion.push('Titulación es requerida');
          }

          if (erroresValidacion.length > 0) {
            resultados.errores++;
            resultados.detalles.push({
              fila: filaActual,
              error: erroresValidacion.join(', ')
            });
            continue;
          }

          // Preparar datos del contacto
          const nuevoContacto = new Contacto({
            nombreCompleto: data.nombreCompleto.trim(),
            telefono: data.telefono?.trim() || null,
            instagram: data.instagram?.trim() || null,
            universidadId: data.universidadId.trim(),
            titulacionId: data.titulacionId.trim(),
            curso: data.curso ? parseInt(data.curso) : null,
            anioNacimiento: data.anioNacimiento ? parseInt(data.anioNacimiento) : null,
            comercialId: data.comercialId?.trim() || req.user!.userId,
            diaLibre: data.diaLibre?.trim() || null,
            createdBy: req.user!.userId
          });

          await nuevoContacto.save();
          
          // Registrar en auditoría
          await AuditLog.create({
            usuarioId: req.user!.userId,
            entidad: EntidadAudit.CONTACTO,
            entidadId: nuevoContacto._id,
            accion: AccionAudit.CREATE,
            despues: nuevoContacto.toObject(),
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          resultados.exitosos++;
          resultados.detalles.push({
            fila: filaActual,
            contacto: {
              id: nuevoContacto._id,
              nombre: nuevoContacto.nombreCompleto
            }
          });
        } catch (error: any) {
          resultados.errores++;
          resultados.detalles.push({
            fila: filaActual,
            error: error.message || 'Error desconocido al crear contacto'
          });
        }
      }

      res.json({
        success: true,
        message: `Importación completada: ${resultados.exitosos} contactos creados, ${resultados.errores} errores`,
        data: {
          contactosCreados: resultados.exitosos,
          errores: resultados.errores,
          detalles: resultados.detalles
        }
      });
    } catch (error) {
      console.error('Error importando contactos desde JSON:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la importación'
      });
    }
  }

  // GET /contactos/comercial/:comercialId - Obtener contactos de un comercial y sus subordinados
  static async getContactosComercial(req: AuthRequest, res: Response) {
    try {
      const { comercialId } = req.params;
      const {
        universidadId,
        titulacionId,
        curso,
        q,
        page = 1,
        limit = 20,
        sortBy = 'fechaAlta',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Verificar permisos - solo admin o el mismo comercial puede ver sus contactos
      if (req.user!.rol !== RolUsuario.ADMIN && req.user!.userId !== comercialId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver los contactos de este comercial'
        });
      }

      // Obtener todos los subordinados del comercial
      const subordinados = await ContactosController.getSubordinados(comercialId);
      const comercialesIncluidos = [comercialId, ...subordinados];
      
      console.log(`📊 Obteniendo contactos para comercial ${comercialId} y subordinados:`, comercialesIncluidos);

      // Construir filtros base
      const filtros: any = {
        $or: [
          { comercialId: { $in: comercialesIncluidos } }, // Contactos asignados al comercial y sus subordinados
          { createdBy: comercialId } // Contactos creados por el comercial
        ]
      };
      
      // Aplicar filtros adicionales
      if (universidadId) filtros.universidadId = universidadId;
      if (titulacionId) filtros.titulacionId = titulacionId;
      if (curso) filtros.curso = parseInt(curso as string);
      
      if (q) {
        filtros.$and = [
          { $or: filtros.$or }, // Mantener el filtro de comerciales
          {
            $or: [
              { nombreCompleto: { $regex: q, $options: 'i' } },
              { telefono: { $regex: q, $options: 'i' } },
              { instagram: { $regex: q, $options: 'i' } }
            ]
          }
        ];
        delete filtros.$or; // Remover el $or original ya que ahora está en $and
      }

      // Construir ordenamiento
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Ejecutar consulta
      const [contactos, total] = await Promise.all([
        Contacto.find(filtros)
          .populate('universidadId', 'nombre')
          .populate('titulacionId', 'nombre')
          .populate('comercialId', 'nombre email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum),
        Contacto.countDocuments(filtros)
      ]);

      res.json({
        success: true,
        data: contactos,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        metadata: {
          comercialId,
          subordinados,
          comercialesIncluidos
        }
      });
    } catch (error) {
      console.error('Error obteniendo contactos del comercial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // PUT /contactos/aumentar-curso
  static async aumentarCursoTodos(req: AuthRequest, res: Response) {
    try {
      // Verificar que el usuario sea administrador
      if (req.user!.rol !== RolUsuario.ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Solo los administradores pueden realizar esta acción'
        });
      }

      // Obtener todos los contactos antes de la actualización para auditoría
      const contactosAntes = await Contacto.find({}).select('_id curso');
      
      // Actualizar todos los contactos incrementando el curso en 1
      const resultado = await Contacto.updateMany(
        {}, // Sin filtros, actualizar todos
        { 
          $inc: { curso: 1 }, // Incrementar curso en 1
          fechaModificacion: new Date()
        }
      );

      // Obtener los contactos actualizados para auditoría
      const contactosDespues = await Contacto.find({}).select('_id curso');

      // Registrar en auditoría la operación masiva
      await AuditLog.create({
        usuarioId: req.user!.userId,
        entidad: EntidadAudit.CONTACTO,
        entidadId: 'BULK_UPDATE', // Identificador especial para operaciones masivas
        accion: AccionAudit.UPDATE,
        antes: { 
          operacion: 'aumentar_curso_masivo',
          contactos_afectados: resultado.modifiedCount,
          resumen_antes: contactosAntes.reduce((acc, c) => {
            acc[c.curso] = (acc[c.curso] || 0) + 1;
            return acc;
          }, {} as Record<number, number>)
        },
        despues: {
          operacion: 'aumentar_curso_masivo',
          contactos_afectados: resultado.modifiedCount,
          resumen_despues: contactosDespues.reduce((acc, c) => {
            acc[c.curso] = (acc[c.curso] || 0) + 1;
            return acc;
          }, {} as Record<number, number>)
        },
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: `Se ha aumentado el curso de ${resultado.modifiedCount} contactos exitosamente`,
        data: {
          contactosModificados: resultado.modifiedCount,
          contactosCoincidentes: resultado.matchedCount
        }
      });
    } catch (error) {
      console.error('Error aumentando curso de contactos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}