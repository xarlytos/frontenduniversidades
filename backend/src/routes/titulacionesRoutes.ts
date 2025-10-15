import { Router } from 'express';
import { TitulacionesController } from '../controllers/TitulacionesController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener titulaciones por universidad
router.get('/universidad/:universidadId', 
  requirePermission('ver_estadisticas'),
  TitulacionesController.obtenerTitulacionesPorUniversidad
);

// Buscar titulación por nombre (debe ir antes de /:id)
router.get('/buscar', TitulacionesController.buscarPorNombre);

// CRUD de titulaciones
router.get('/', 
  requirePermission('gestionar_titulaciones'),
  TitulacionesController.obtenerTitulaciones
);

router.get('/:id', 
  requirePermission('gestionar_titulaciones'),
  TitulacionesController.obtenerTitulacion
);

router.post('/', 
  requirePermission('gestionar_titulaciones'),
  TitulacionesController.crearTitulacion
);

router.put('/:id', 
  requirePermission('gestionar_titulaciones'),
  TitulacionesController.actualizarTitulacion
);

router.delete('/:id', 
  requirePermission('gestionar_titulaciones'),
  TitulacionesController.eliminarTitulacion
);

export default router;