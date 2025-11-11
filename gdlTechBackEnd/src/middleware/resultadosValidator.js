const { validationResult } = require('express-validator');
const JsonResponse = require('../utils/JsonResponse');

/**
 * Middleware para manejar el resultado de las validaciones de express-validator.
 * Si hay errores, responde con un 422 usando JsonResponse. Si no, pasa al siguiente middleware/controlador.
 */
exports.validarResultados = (req, res, next) => {
    // Encuentra los errores de validación en esta petición
    const errors = validationResult(req);
    
    // Si hay errores, responde con un 422 y la lista de errores usando JsonResponse
    if (!errors.isEmpty()) {
        const erroresFormateados = errors.array().map(err => ({
            campo: err.param || err.path,
            mensaje: err.msg,
            valor: err.value
        }));
        return JsonResponse.validationError(res, erroresFormateados);
    }
    
    // Si no hay errores, continúa con el siguiente middleware
    next();
};