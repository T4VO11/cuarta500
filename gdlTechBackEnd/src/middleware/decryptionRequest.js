const Encryption = require('../utils/encryption');

const decryptRequest = (req, res, next) => {
    // 1. Validaciones rápidas para dejar pasar peticiones normales
    // Si no hay cuerpo (GET) o no tiene la propiedad 'data', pasa de largo.
    if (!req.body || !req.body.data) {
        return next();
    }

    // Si 'data' NO es un texto, asumimos que no está cifrado y dejamos pasar.
    // Esto es útil si un día apagas el cifrado en el frontend; el backend seguirá funcionando.
    if (typeof req.body.data !== 'string') {
        return next();
    }

    // 2. Intentamos descifrar
    try {
        console.log('Recibiendo datos cifrados, descifrando...');
        
        // Usamos tu utilidad existente para descifrar el string
        const decryptedData = Encryption.decrypt(req.body.data);
        
        // 3. ¡EL TRUCO DE MAGIA!
        // Reemplazamos el cuerpo cifrado por los datos reales (JSON)
        // Así, tus controladores (Login, Store) ni se enteran de que vino cifrado.
        req.body = decryptedData;
        
        next(); // Continuar al controlador

    } catch (error) {
        console.error('Error descifrando petición entrante:', error);
        return res.status(400).json({
            estado: 'error',
            mensaje: 'Datos corruptos o ilegibles. Verifica tus llaves de seguridad.',
            data: null
        });
    }
};

module.exports = decryptRequest;