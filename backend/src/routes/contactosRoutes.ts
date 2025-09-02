import { Router } from 'express';
import { ContactosController } from '../controllers/ContactosController';
import { authenticateToken } from '../middleware/auth';
import { requireAnyPermission, requireRole } from '../middleware/authorization';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// CRUD de contactos
router.get('/', ContactosController.getContactos);
// CAMBIADO: Eliminar requireAnyPermission para crear contactos
router.post('/', ContactosController.crearContacto);

// Operaciones masivas - Solo para administradores (DEBE IR ANTES DE LAS RUTAS CON :id)
router.put('/aumentar-curso', requireAnyPermission(['admin']), ContactosController.aumentarCursoTodos);

// Obtener TODOS los contactos sin filtros - Para administradores o usuarios con permiso VER_CONTACTOS
router.get('/todos', requireAnyPermission(['VER_CONTACTOS']), ContactosController.getTodosLosContactos);

// Obtener contactos de un comercial y sus subordinados
router.get('/comercial/:comercialId', requireAnyPermission(['ver_contactos']), ContactosController.getContactosComercial);

// Rutas con parámetros (DEBEN IR DESPUÉS DE LAS RUTAS ESPECÍFICAS)
router.get('/:id', ContactosController.getContacto);
router.put('/:id', requireAnyPermission(['editar_contactos']), ContactosController.actualizarContacto);
router.delete('/:id', requireAnyPermission(['eliminar_contactos']), ContactosController.eliminarContacto);

// Asignación de contactos
router.put('/:id/asignar', requireAnyPermission(['asignar_contactos']), ContactosController.asignarComercial);

// Importación y exportación
router.post('/importar', 
  requireAnyPermission(['importar_contactos']), 
  ContactosController.importarContactosJSON
);
router.get('/exportar/excel', 
  requireAnyPermission(['exportar_contactos']), 
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Funcionalidad de exportación no implementada aún'
    });
  }
);

// Historial de contactos - Placeholder route (method needs to be implemented)
router.get('/:id/historial', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Funcionalidad de historial no implementada aún'
  });
});



export default router;