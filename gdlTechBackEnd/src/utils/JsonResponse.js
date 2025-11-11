/**
 * Utilidad para crear respuestas JSON estandarizadas
 * Todas las respuestas de la API deben usar este formato
 */
class JsonResponse {
    /**
     * Crea una respuesta exitosa
     * @param {Object} res - Objeto response de Express
     * @param {*} data - Datos a devolver
     * @param {string} mensaje - Mensaje descriptivo
     * @param {number} statusCode - Código de estado HTTP (default: 200)
     */
    static success(res, data = null, mensaje = 'Operación exitosa', statusCode = 200) {
        return res.status(statusCode).json({
            estado: 'exito',
            mensaje: mensaje,
            data: data
        });
    }

    /**
     * Crea una respuesta de error
     * @param {Object} res - Objeto response de Express
     * @param {string} mensaje - Mensaje de error
     * @param {number} statusCode - Código de estado HTTP (default: 400)
     * @param {*} data - Datos adicionales del error (opcional)
     */
    static error(res, mensaje = 'Error en la operación', statusCode = 400, data = null) {
        return res.status(statusCode).json({
            estado: 'error',
            mensaje: mensaje,
            data: data
        });
    }

    /**
     * Crea una respuesta de error de validación
     * @param {Object} res - Objeto response de Express
     * @param {Array} errores - Array de errores de validación
     * @param {number} statusCode - Código de estado HTTP (default: 422)
     */
    static validationError(res, errores, statusCode = 422) {
        return res.status(statusCode).json({
            estado: 'error',
            mensaje: 'Error de validación',
            data: {
                errores: errores
            }
        });
    }

    /**
     * Crea una respuesta de no encontrado
     * @param {Object} res - Objeto response de Express
     * @param {string} mensaje - Mensaje descriptivo
     */
    static notFound(res, mensaje = 'Recurso no encontrado') {
        return res.status(404).json({
            estado: 'error',
            mensaje: mensaje,
            data: null
        });
    }

    /**
     * Crea una respuesta de no autorizado
     * @param {Object} res - Objeto response de Express
     * @param {string} mensaje - Mensaje descriptivo
     */
    static unauthorized(res, mensaje = 'No autorizado') {
        return res.status(401).json({
            estado: 'error',
            mensaje: mensaje,
            data: null
        });
    }
}

module.exports = JsonResponse;

