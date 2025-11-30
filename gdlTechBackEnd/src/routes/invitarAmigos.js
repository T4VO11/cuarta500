const express = require('express');
const router = express.Router();
const invitarAmigosController = require('../app/controllers/invitarAmigosController');
const { validarInvitarAmigo } = require('../middleware/invitarAmigoValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Rutas protegidas con autenticaciOn de administrador
router.get('/', authMiddleware, requireAdmin, invitarAmigosController.index);
router.post('/', authMiddleware, requireAdmin, validarInvitarAmigo, invitarAmigosController.store);

// Rutas para usuarios autenticados (sin requerir admin) - DEBEN IR ANTES de /:id
router.post('/crear', authMiddleware, validarInvitarAmigo, invitarAmigosController.store);
router.get('/mis-invitaciones', authMiddleware, invitarAmigosController.misInvitaciones);

// Rutas protegidas con autenticaciOn de administrador (con parámetros)
router.get('/:id', authMiddleware, requireAdmin, invitarAmigosController.show);
router.put('/:id', authMiddleware, requireAdmin, validarInvitarAmigo, invitarAmigosController.update);
router.delete('/:id', authMiddleware, requireAdmin, invitarAmigosController.destroy);

module.exports = router;