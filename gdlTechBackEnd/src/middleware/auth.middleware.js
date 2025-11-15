const jwt = require('jsonwebtoken');
const tokenBlacklist = require('../utils/tokenBlacklist');

/**
 * Middleware de autenticación.
 * Verifica el token (JWT) enviado en la cabecera 'Authorization'.
 * Si el token es válido, extrae el payload (datos del usuario) y lo
 * adjunta al objeto 'req' (req.usuario) para que los siguientes
 * middlewares o controladores puedan usarlo.
 */
module.exports = function(req, res, next) {
    // 1. Obtener el token de la cabecera
    const authHeader = req.header('Authorization');

    const JsonResponse = require('../utils/JsonResponse');

    // 2. Revisar si no hay un token
    if (!authHeader) {
        return JsonResponse.unauthorized(res, 'No hay token, permiso no válido');
    }

    // 3. Validar el formato del token (debe ser "Bearer <token>")
    const tokenParts = authHeader.split(' ');
    
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
         return JsonResponse.unauthorized(res, 'Formato de token no válido');
    }

    const token = tokenParts[1];

    // 4. Verificar si el token está en la blacklist (fue invalidado)
    if (tokenBlacklist.has(token)) {
        console.log('Intento de usar token invalidado');
        return JsonResponse.unauthorized(res, 'Token invalidado. La sesión ha sido cerrada');
    }

    // 5. Verificar el token
    try {
        // jwt.verify() revisa si el token es válido y no ha expirado
        // usando la misma llave secreta que usamos para firmarlo.
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret-key-change-in-production');
        
        // Si es válido, 'decoded' contiene el payload (ej. { usuario: { id: '...', rol: '...' } })
        // Adjuntamos el payload del usuario al objeto request
        req.usuario = decoded.usuario; 
        
        // next() le dice a Express que pase al siguiente middleware o al controlador
        next(); 

    } catch (error) {
        // Si el token no es válido (firma incorrecta, expirado, etc.)
        console.error('Error al verificar token:', error.message);
        return JsonResponse.unauthorized(res, 'Token no válido o expirado');
    }
};