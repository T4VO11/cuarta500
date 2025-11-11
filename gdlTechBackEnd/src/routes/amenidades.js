const express = require('express');
const router = express.Router();
const amenidadesController = require('../app/controllers/amenidadesController');
const { validarAmenidad } = require('../middleware/amenidadValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('amenidades');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, amenidadesController.index);
router.get('/:id', authMiddleware, requireAdmin, amenidadesController.show);
router.post('/', authMiddleware, requireAdmin, upload.array('galeria', 10), validarAmenidad, amenidadesController.store);
router.put('/:id', authMiddleware, requireAdmin, upload.array('galeria', 10), validarAmenidad, amenidadesController.update);
router.delete('/:id', authMiddleware, requireAdmin, amenidadesController.destroy);

module.exports = router;

