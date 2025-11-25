const express = require('express');
const router = express.Router();
const reservacionesController = require('../app/controllers/reservacionesController');
const { validarReservacion } = require('../middleware/reservacionValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Ruta para usuarios normales: obtener reservaciones (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.get('/mis-reservaciones', authMiddleware, reservacionesController.misReservaciones);

// Rutas GET: solo requieren autenticación (usuarios normales pueden ver)
router.get('/', authMiddleware, reservacionesController.index);
router.get('/:id', authMiddleware, reservacionesController.show);

// Rutas de modificación: requieren administrador
router.post('/', authMiddleware, requireAdmin, validarReservacion, reservacionesController.store);
router.put('/:id', authMiddleware, requireAdmin, validarReservacion, reservacionesController.update);
router.delete('/:id', authMiddleware, requireAdmin, reservacionesController.destroy);

module.exports = router;

