const express = require('express');
const router = express.Router();
const reservacionesController = require('../app/controllers/reservacionesController');
const { validarReservacion } = require('../middleware/reservacionValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdminOrDueño } = require('../middleware/role.middleware');

// Ruta para usuarios normales: obtener reservaciones (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.get('/mis-reservaciones', authMiddleware, reservacionesController.misReservaciones);

// Ruta para usuarios normales: crear reservación (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.post('/crear', authMiddleware, reservacionesController.crear);

// Rutas GET: solo requieren autenticación (usuarios normales pueden ver)
router.get('/', authMiddleware, reservacionesController.index);
router.get('/:id', authMiddleware, reservacionesController.show);

// Rutas de modificación: requieren administrador
router.post('/', authMiddleware, requireAdminOrDueño, validarReservacion, reservacionesController.store);
router.put('/:id', authMiddleware, requireAdminOrDueño, validarReservacion, reservacionesController.update);
router.delete('/:id', authMiddleware, requireAdminOrDueño, reservacionesController.destroy);

//Ruta para el pago de terraza 
router.post('/crear-pago', reservacionesController.crearSesionPago);

//Ruta para la confirmacion de pagos 
router.post('/confirmar-pago', reservacionesController.confirmarPago);

module.exports = router;

