const express = require('express');
const router = express.Router();
const bitacorasController = require('../app/controllers/bitacorasController');
const { validarBitacora } = require('../middleware/bitacoraValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('bitacoras');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, bitacorasController.index);
router.get('/:id', authMiddleware, requireAdmin, bitacorasController.show);
router.post('/', authMiddleware, requireAdmin, upload.single('imagen_ine'), validarBitacora, bitacorasController.store);
router.put('/:id', authMiddleware, requireAdmin, upload.single('imagen_ine'), validarBitacora, bitacorasController.update);
router.delete('/:id', authMiddleware, requireAdmin, bitacorasController.destroy);

module.exports = router;

