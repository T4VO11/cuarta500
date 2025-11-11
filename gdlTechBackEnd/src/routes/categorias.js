const express = require('express');
const router = express.Router();
const categoriasController = require('../app/controllers/categoriasController');
const { validarCategoria } = require('../middleware/categoriaValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, categoriasController.index);
router.get('/:id', authMiddleware, requireAdmin, categoriasController.show);
router.post('/', authMiddleware, requireAdmin, validarCategoria, categoriasController.store);
router.put('/:id', authMiddleware, requireAdmin, validarCategoria, categoriasController.update);
router.delete('/:id', authMiddleware, requireAdmin, categoriasController.destroy);

module.exports = router;

