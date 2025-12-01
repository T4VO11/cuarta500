const express = require('express');
const router = express.Router();
const reglamentosController = require('../app/controllers/reglamentosController');
const { validarReglamento } = require('../middleware/reglamentoValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin, requireAnyRole } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('reglamentos');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAnyRole, reglamentosController.index);
router.get('/:id', authMiddleware, requireAnyRole, reglamentosController.show);
router.post('/', authMiddleware, requireAdmin, upload.single('pdf'), validarReglamento, reglamentosController.store);
router.put('/:id', authMiddleware, requireAdmin, upload.single('pdf'), validarReglamento, reglamentosController.update);
router.delete('/:id', authMiddleware, requireAdmin, reglamentosController.destroy);

module.exports = router;

