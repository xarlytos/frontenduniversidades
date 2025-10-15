import { Router } from 'express';
import { UniversidadesController } from '../controllers/UniversidadesController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener todas las universidades (público para usuarios autenticados)
router.get('/', UniversidadesController.obtenerUniversidades);

// Obtener universidades con estadísticas completas
router.get('/estadisticas', 
  UniversidadesController.obtenerUniversidadesConEstadisticas
);

// Buscar universidad por código (debe ir antes de /:id para evitar conflictos)
router.get('/codigo/:codigo', UniversidadesController.buscarPorCodigo);

// CRUD de universidades (solo admins)
router.get('/:id', 
  requirePermission('gestionar_universidades'),
  UniversidadesController.obtenerUniversidad
);

router.post('/', 
  UniversidadesController.crearUniversidad
);

router.put('/:id', 
  requirePermission('gestionar_universidades'),
  UniversidadesController.actualizarUniversidad
);

router.delete('/:id', 
  requirePermission('gestionar_universidades'),
  UniversidadesController.eliminarUniversidad
);

export default router;