import { Router } from 'express';
import { EstadisticasController } from '../controllers/EstadisticasController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Estadísticas generales
router.get('/contactos', 
  requirePermission('ver_estadisticas'), 
  EstadisticasController.getTotal
);

router.get('/contactos/universidades', 
  requirePermission('ver_estadisticas'), 
  EstadisticasController.getPorUniversidades
);

router.get('/contactos/titulaciones', 
  requirePermission('ver_estadisticas'), 
  EstadisticasController.getPorTitulaciones
);

export default router;