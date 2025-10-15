import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Rutas públicas
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);

// Rutas protegidas
router.get('/profile', authenticateToken, AuthController.me);
router.get('/permissions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const permisos = await AuthController.getPermisosEfectivos(req.user!.userId);
    res.json({
      success: true,
      permisos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos'
    });
  }
});

export default router;