const express = require('express');
const router = express.Router();
const listadoAdeudosController = require('../app/controllers/listadoAdeudosController');
const { validarListadoAdeudo } = require('../middleware/listadoAdeudoValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Ruta para usuarios normales: obtener adeudos del usuario (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.get('/mis-adeudos', authMiddleware, listadoAdeudosController.misAdeudos);

// Rutas GET: solo requieren autenticación (usuarios normales pueden ver)
router.get('/', authMiddleware, listadoAdeudosController.index);
router.get('/:id', authMiddleware, listadoAdeudosController.show);

// Rutas de modificación: requieren administrador
router.post('/', authMiddleware, requireAdmin, validarListadoAdeudo, listadoAdeudosController.store);
router.put('/:id', authMiddleware, requireAdmin, validarListadoAdeudo, listadoAdeudosController.update);
router.delete('/:id', authMiddleware, requireAdmin, listadoAdeudosController.destroy);

module.exports = router;

