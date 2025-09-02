import { Router } from 'express';
import { JerarquiasController } from '../controllers/JerarquiasController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de jerarquías
router.get('/', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.obtenerJerarquias
);

router.get('/:id', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.obtenerJerarquia
);

router.post('/', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.crearJerarquia
);

router.put('/:id', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.actualizarJerarquia
);

router.delete('/:id', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.eliminarJerarquia
);

// Gestión de subordinados
router.post('/:id/subordinados', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.agregarSubordinado
);

router.delete('/:id/subordinados/:usuarioId', 
  requirePermission('gestionar_jerarquias'),
  JerarquiasController.removerSubordinado
);

export default router;