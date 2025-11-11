const express = require('express');
const router = express.Router();
const reporteFinanzasController = require('../app/controllers/reporteFinanzasController');
const { validarReporteFinanza } = require('../middleware/reporteFinanzaValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('reporteFinanzas');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, reporteFinanzasController.index);
router.get('/:id', authMiddleware, requireAdmin, reporteFinanzasController.show);
router.post('/', authMiddleware, requireAdmin, upload.single('imagen'), validarReporteFinanza, reporteFinanzasController.store);
router.put('/:id', authMiddleware, requireAdmin, upload.single('imagen'), validarReporteFinanza, reporteFinanzasController.update);
router.delete('/:id', authMiddleware, requireAdmin, reporteFinanzasController.destroy);

module.exports = router;

