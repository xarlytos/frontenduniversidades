import { Router } from 'express';
import { UsuariosController } from '../controllers/UsuariosController';
import { authenticateToken } from '../middleware/auth';
import { requirePermission } from '../middleware/authorization';

const router = Router();

// Ruta pública para crear administradores (sin autenticación)
router.post('/admin', (req, res, next) => {
  console.log('🔥 POST /admin - Creando administrador sin autenticación');
  console.log('📝 Body:', req.body);
  next();
}, UsuariosController.crearAdministrador);

// Todas las demás rutas requieren autenticación
router.use((req, res, next) => {
  console.log('🔐 Middleware de autenticación aplicado para:', req.method, req.path);
  next();
}, authenticateToken);

// CRUD de usuarios
router.get('/', 
  (req, res, next) => {
    console.log('📋 GET /usuarios - Obteniendo lista de usuarios');
    next();
  },
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.obtenerUsuarios
);

// Obtener todos los usuarios independiente del rol
router.get('/todos', 
  (req, res, next) => {
    console.log('📋 GET /usuarios/todos - Obteniendo todos los usuarios');
    next();
  },
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.obtenerTodosLosUsuarios
);

router.get('/:id', 
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.obtenerUsuario
);

router.post('/', 
  (req, res, next) => {
    console.log('👤 POST /usuarios - Creando nuevo usuario');
    console.log('📝 Body:', req.body);
    next();
  },
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.crearUsuario
);

router.put('/:id', 
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.actualizarUsuario
);

router.delete('/:id', 
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.eliminarUsuario
);

// Gestión de contraseñas
router.put('/:id/password', UsuariosController.cambiarPassword);

// Permisos efectivos
router.get('/:id/permisos', 
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.obtenerPermisosEfectivos
);

// Actualizar permisos de un usuario
router.put('/:id/permisos', 
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.actualizarPermisos
);

// Gestión de jerarquías
router.get('/jerarquias', 
  (req, res, next) => {
    console.log('🔗 GET /usuarios/jerarquias - Obteniendo jerarquías');
    next();
  },
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.obtenerJerarquias
);

router.post('/:id/asignar-jefe', 
  (req, res, next) => {
    console.log('🔗 POST /:id/asignar-jefe - Asignando jefe a usuario');
    console.log('📝 Body:', req.body);
    next();
  },
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.asignarJefe
);

router.delete('/:id/remover-jefe', 
  (req, res, next) => {
    console.log('🔗 DELETE /:id/remover-jefe - Removiendo jefe de usuario');
    next();
  },
  requirePermission('GESTIONAR_USUARIOS'), 
  UsuariosController.removerJefe
);

export default router;