const express = require('express');
const router = express.Router();
const incidenteController = require('../app/controllers/incidentesController'); // RUTA CORREGIDA
const { validarCrearIncidente } = require('../middleware/incidenteValidator'); // RUTA CORREGIDA
const authMiddleware = require('../middleware/auth.middleware'); // Asumo que está en src/middleware/
const upload = require('../../multerConfig'); // RUTA CORREGIDA (Sube 2 niveles desde src/routes/ a la raíz)

// --- Rutas Privadas (Requieren Token) ---

// POST /api/incidentes
// (Crear un nuevo incidente, requiere token y una imagen)
router.post(
    '/', 
    authMiddleware, 
    upload.single('imagen'), // Middleware de Multer. 'imagen' es el 'name' del campo en el form-data
    validarCrearIncidente, // Tus validaciones de express-validator
    incidenteController.crearIncidente
);

// GET /api/incidentes
// (Obtiene todos los incidentes DEL CONDOMINIO del usuario logueado)
router.get('/', authMiddleware, incidenteController.obtenerIncidentesPorCondominio);

// Aquí irían tus otros endpoints:
// router.get('/:id', authMiddleware, ...); // Ver detalle de un incidente
// router.put('/:id', [authMiddleware, authRoles('admin', 'guardia')], ...); // Actualizar estado (solo admin/guardia)


module.exports = router;