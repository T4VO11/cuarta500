const { validationResult } = require('express-validator');

/**
 * Middleware para manejar el resultado de las validaciones de express-validator.
 * Si hay errores, responde con un 400. Si no, pasa al siguiente middleware/controlador.
 */
exports.validarResultados = (req, res, next) => {
    // Encuentra los errores de validación en esta petición
    const errors = validationResult(req);
    
    // Si hay errores, responde con un 400 y la lista de errores
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    // Si no hay errores, continúa con el siguiente middleware
    next();
};