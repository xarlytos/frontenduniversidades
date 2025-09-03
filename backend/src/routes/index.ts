import { Router } from 'express';
import authRoutes from './authRoutes';
import contactosRoutes from './contactosRoutes';
import estadisticasRoutes from './estadisticasRoutes';
import usuariosRoutes from './usuariosRoutes';
// import jerarquiasRoutes from './jerarquiasRoutes'; // ← ELIMINADO
import universidadesRoutes from './universidadesRoutes';
import titulacionesRoutes from './titulacionesRoutes';

const router = Router();

// Configurar todas las rutas
router.use('/auth', authRoutes);
router.use('/contactos', contactosRoutes);
router.use('/estadisticas', estadisticasRoutes);
router.use('/usuarios', usuariosRoutes);
// router.use('/jerarquias', jerarquiasRoutes); // ← ELIMINADO
router.use('/universidades', universidadesRoutes);
router.use('/titulaciones', titulacionesRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'University Management System API'
  });
});

export default router;