const express = require('express');
const router = express.Router();
const listadoAdeudosController = require('../app/controllers/listadoAdeudosController');
const { validarListadoAdeudo } = require('../middleware/listadoAdeudoValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, listadoAdeudosController.index);
router.get('/:id', authMiddleware, requireAdmin, listadoAdeudosController.show);
router.post('/', authMiddleware, requireAdmin, validarListadoAdeudo, listadoAdeudosController.store);
router.put('/:id', authMiddleware, requireAdmin, validarListadoAdeudo, listadoAdeudosController.update);
router.delete('/:id', authMiddleware, requireAdmin, listadoAdeudosController.destroy);

module.exports = router;

