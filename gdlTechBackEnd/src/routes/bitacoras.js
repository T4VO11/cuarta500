const express = require('express');
const router = express.Router();
const bitacorasController = require('../app/controllers/bitacorasController');
const { validarBitacora } = require('../middleware/bitacoraValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireAdminOrGuardia } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('bitacoras');

// Ruta para usuarios normales: obtener historial de accesos (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.get('/mi-historial', authMiddleware, bitacorasController.miHistorial);

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdminOrGuardia, bitacorasController.index);
router.get('/:id', authMiddleware, requireAdminOrGuardia, bitacorasController.show);
router.post('/', authMiddleware, requireAdmin, upload.single('imagen_ine'), validarBitacora, bitacorasController.store);
router.put('/:id', authMiddleware, requireAdmin, upload.single('imagen_ine'), validarBitacora, bitacorasController.update);
router.delete('/:id', authMiddleware, requireAdmin, bitacorasController.destroy);

module.exports = router;

