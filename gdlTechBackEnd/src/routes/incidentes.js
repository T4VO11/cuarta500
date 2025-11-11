const express = require('express');
const router = express.Router();
const incidentesController = require('../app/controllers/incidentesController');
const { validarIncidente } = require('../middleware/incidenteValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, incidentesController.index);
router.get('/:id', authMiddleware, requireAdmin, incidentesController.show);
router.post('/', authMiddleware, requireAdmin, validarIncidente, incidentesController.store);
router.put('/:id', authMiddleware, requireAdmin, validarIncidente, incidentesController.update);
router.delete('/:id', authMiddleware, requireAdmin, incidentesController.destroy);

module.exports = router;
