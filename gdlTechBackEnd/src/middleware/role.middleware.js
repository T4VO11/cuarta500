const JsonResponse = require('../utils/JsonResponse');

/**
 * Middleware de autorización por roles.
 * Verifica que el usuario tenga uno de los roles permitidos.
 * 
 * Uso:
 * router.get('/ruta-admin', authMiddleware, requireRole(['administrador']), controller.method);
 * router.get('/ruta-admin-guardia', authMiddleware, requireRole(['administrador', 'guardia']), controller.method);
 */
const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // Verificar que req.usuario existe (debe pasar por authMiddleware primero)
        if (!req.usuario) {
            return JsonResponse.unauthorized(res, 'Usuario no autenticado');
        }
        const usuarioRol = req.usuario.rol || (req.usuario.usuario ? req.usuario.usuario.rol : null);

        if (!usuarioRol) {
             return JsonResponse.error(res, 'Token inválido: No se encuentra el rol del usuario', 403);
        }

        // Verificar que el usuario tenga uno de los roles permitidos
        if (!rolesPermitidos.includes(usuarioRol)) {
            return JsonResponse.error(
                res, 
                `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
                403
            );
        }

        // Si tiene el rol correcto, continuar
        next();
    };
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
const requireAdmin = requireRole(['administrador']);

/**
 * Middleware para verificar que sea Guardia
 */
const requireGuardia = requireRole(['guardia']);

/**
 * Middleware para verificar que sea Residente
 */
const requireDueño = requireRole(['dueño']);

/**
 * Middleware para verificar que el usuario sea administrador o guardia
 */
const requireAdminOrGuardia = requireRole(['administrador', 'guardia']);

module.exports = {
    requireRole,
    requireAdmin,
    requireGuardia,
    requireDueño,
    requireAdminOrGuardia
};

