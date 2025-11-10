const express = require('express');
const router = express.Router();
const usuarioController = require('../app/controllers/usuariosController'); // RUTA CORREGIDA
const { validarCrearUsuario, validarLogin } = require('../middleware/usuarioValidator'); // RUTA CORREGIDA
const authMiddleware = require('../middleware/auth.middleware'); // Tu middleware de JWT (Asumo que está en src/middleware/)

// --- Rutas Públicas (Registro y Login) ---

// POST /api/usuarios/registrar
// (Registro de un nuevo usuario)
// NOTA: Si solo 'dueños' o 'admins' pueden crear usuarios, esta ruta debería tener 'authMiddleware'
router.post('/registrar', validarCrearUsuario, usuarioController.crearUsuario);

// POST /api/usuarios/login
// (Login para obtener token)
router.post('/login', validarLogin, usuarioController.loginUsuario);


// --- Rutas Privadas (Requieren Token) ---
// De aquí en adelante, todas las rutas deben pasar por el middleware de autenticación

// GET /api/usuarios
// (Obtiene todos los usuarios DEL CONDOMINIO del usuario logueado)
router.get('/', authMiddleware, usuarioController.obtenerUsuariosPorCondominio);

// GET /api/usuarios/:id
// (Obtiene un usuario específico por su ID)
router.get('/:id', authMiddleware, usuarioController.obtenerUsuarioPorId);

// PUT /api/usuarios/:id
// (Actualiza los datos de un usuario. Solo admin o el propio usuario)
router.put('/:id', authMiddleware, usuarioController.actualizarUsuario);

// DELETE /api/usuarios/:id
// (Desactiva un usuario - Soft Delete. Asumimos que solo un admin puede hacerlo)
router.delete('/:id', authMiddleware, usuarioController.desactivarUsuario);

// Ruta para que un dueño cree un habitante/arrendatario
// (Es la misma ruta 'registrar' pero ahora protegida por auth)
router.post(
    '/crear-habitante', // Un endpoint más específico
    authMiddleware, // Requiere token
    // authRoles('dueño'), // Requeriría un middleware de roles que verifique req.usuario.rol
    validarCrearUsuario, 
    usuarioController.crearUsuario
);


module.exports = router;