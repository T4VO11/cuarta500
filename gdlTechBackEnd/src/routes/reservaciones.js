const express = require('express');
const router = express.Router();
const reservacionesController = require('../app/controllers/reservacionesController');
const { validarReservacion } = require('../middleware/reservacionValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, reservacionesController.index);
router.get('/:id', authMiddleware, requireAdmin, reservacionesController.show);
router.post('/', authMiddleware, requireAdmin, validarReservacion, reservacionesController.store);
router.put('/:id', authMiddleware, requireAdmin, validarReservacion, reservacionesController.update);
router.delete('/:id', authMiddleware, requireAdmin, reservacionesController.destroy);

module.exports = router;

