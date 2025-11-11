const express = require('express');
const router = express.Router();
const invitarAmigosController = require('../app/controllers/invitarAmigosController');
const { validarInvitarAmigo } = require('../middleware/invitarAmigoValidator');
const authMiddleware = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

// Rutas protegidas con autenticación de administrador
router.get('/', authMiddleware, requireAdmin, invitarAmigosController.index);
router.get('/:id', authMiddleware, requireAdmin, invitarAmigosController.show);
router.post('/', authMiddleware, requireAdmin, validarInvitarAmigo, invitarAmigosController.store);
router.put('/:id', authMiddleware, requireAdmin, validarInvitarAmigo, invitarAmigosController.update);
router.delete('/:id', authMiddleware, requireAdmin, invitarAmigosController.destroy);

module.exports = router;

