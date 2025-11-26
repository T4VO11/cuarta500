const Encryption = require('./encryption');

class JsonResponse {
    
    static success(res, data = null, mensaje = 'Operación exitosa', statusCode = 200) {
        // 1. Preparamos la variable final
        let dataFinal = data;

        // 2. Leemos el INTERRUPTOR (no la llave)
        // Asegúrate de tener ENCRIPTAR_RESPUESTAS=true en tu archivo .env
        const activarCifrado = process.env.ENCRIPTAR_RESPUESTAS === 'true';

        // 3. Verificamos si hay data Y si el interruptor está encendido
        if (data && activarCifrado) {
            try {
                // Encryption.encrypt usará internamente process.env.ENCRYPTION_KEY
                dataFinal = Encryption.encrypt(data); 
            } catch (error) {
                console.error("Error al cifrar respuesta automática:", error);
            }
        }
        
        return res.status(statusCode).json({
            estado: 'exito',
            mensaje: mensaje,
            data: dataFinal // <--- CORREGIDO: Devolvemos la data procesada
        });
    }

    // ... (El resto de métodos error, validationError, etc. déjalos igual) ...
    static error(res, mensaje = 'Error en la operación', statusCode = 400, data = null) {
        return res.status(statusCode).json({
            estado: 'error',
            mensaje: mensaje,
            data: data
        });
    }
    
    static validationError(res, errores, statusCode = 422) {
        return res.status(statusCode).json({
            estado: 'error',
            mensaje: 'Error de validación',
            data: { errores: errores }
        });
    }

    static notFound(res, mensaje = 'Recurso no encontrado') {
        return res.status(404).json({
            estado: 'error',
            mensaje: mensaje,
            data: null
        });
    }

    static unauthorized(res, mensaje = 'No autorizado') {
        return res.status(401).json({
            estado: 'error',
            mensaje: mensaje,
            data: null
        });
    }
}

module.exports = JsonResponse;