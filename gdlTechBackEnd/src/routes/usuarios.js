const express = require('express');
const router = express.Router();
const usuariosController = require('../app/controllers/usuariosController');
const { validarCrearUsuario, validarLogin, validarActualizarUsuario } = require('../middleware/usuarioValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');
const createUploader = require('../../multerConfig');

const upload = createUploader('usuarios');

// --- Rutas Públicas (Registro y Login) ---
// POST /usuarios/registrar - Registro de nuevo usuario (NO devuelve token)
// Nota: Los archivos son opcionales - multer solo se aplica si es multipart/form-data
console.log('Registrando ruta POST /usuarios/registrar');

// Middleware opcional para multer
const multerOptional = (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        upload.fields([
            { name: 'imagen_perfil', maxCount: 1 },
            { name: 'imagen_ine', maxCount: 1 }
        ])(req, res, (err) => {
            if (err && (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT')) {
                return next();
            }
            if (err) return next(err);
            next();
        });
    } else {
        next();
    }
};

router.post('/registrar', multerOptional, validarCrearUsuario, usuariosController.store);

// POST /usuarios/login - Login para obtener token
router.post('/login', validarLogin, usuariosController.login);

// POST /usuarios/logout - Logout (invalidar sesión)
router.post('/logout', authMiddleware, /*requireAdmin,*/ usuariosController.logout);

// GET /usuarios/mi-perfil - Obtener perfil del usuario autenticado (solo autenticación, sin requireAdmin)
// IMPORTANTE: Esta ruta debe ir ANTES de /:id para que no la capture
router.get('/mi-perfil', authMiddleware, usuariosController.miPerfil);

// --- Rutas Privadas (Requieren Token de Administrador) ---
// GET /usuarios - Obtener todos los usuarios
router.get('/', authMiddleware, requireAdmin, usuariosController.index);

// GET /usuarios/:id - Obtener un usuario por ID
router.get('/:id', authMiddleware, requireAdmin, usuariosController.show);

// PUT /usuarios/:id - Actualizar un usuario
router.put('/:id', 
    authMiddleware,
    requireAdmin,
    (req, res, next) => {
        // Si no hay Content-Type multipart/form-data, saltamos multer
        const contentType = req.headers['content-type'] || '';
        if (!contentType.includes('multipart/form-data')) {
            return next();
        }
        upload.fields([
            { name: 'imagen_perfil', maxCount: 1 },
            { name: 'imagen_ine', maxCount: 1 }
        ])(req, res, (err) => {
            // Ignoramos errores de multer relacionados con archivos faltantes
            if (err && (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT')) {
                return next();
            }
            if (err) {
                return next(err);
            }
            next();
        });
    },
    validarActualizarUsuario, 
    usuariosController.update
);

// DELETE /usuarios/:id - Eliminar un usuario
router.delete('/:id', authMiddleware, requireAdmin, usuariosController.destroy);

module.exports = router;
