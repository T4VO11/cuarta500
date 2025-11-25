const express = require('express');
const router = express.Router();
const amenidadesController = require('../app/controllers/amenidadesController');
const { validarAmenidad } = require('../middleware/amenidadValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('amenidades');

// Ruta para usuarios normales: obtener amenidades disponibles (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.get('/disponibles', authMiddleware, amenidadesController.disponibles);

// Rutas GET: solo requieren autenticación (usuarios normales pueden ver)
router.get('/', authMiddleware, amenidadesController.index);
router.get('/:id', authMiddleware, amenidadesController.show);

// Rutas de modificación: requieren administrador
router.post('/', authMiddleware, requireAdmin, upload.array('galeria', 10), validarAmenidad, amenidadesController.store);
router.put('/:id', authMiddleware, requireAdmin, upload.array('galeria', 10), validarAmenidad, amenidadesController.update);
router.delete('/:id', authMiddleware, requireAdmin, amenidadesController.destroy);

module.exports = router;

