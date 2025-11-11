const crypto = require('crypto');

/**
 * Utilidad para cifrar y descifrar datos
 * Usa AES-256-CBC para el cifrado
 */
class Encryption {
    /**
     * Genera una clave de cifrado desde una contraseña usando PBKDF2
     * @param {string} password - Contraseña base
     * @param {string} salt - Salt para la derivación (opcional, se genera si no se proporciona)
     * @returns {Object} - Objeto con key y salt
     */
    static generateKey(password, salt = null) {
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
        }
        const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
        return {
            key: key.toString('hex'),
            salt: salt
        };
    }

    /**
     * Cifra un objeto o string usando AES-256-CBC
     * @param {*} data - Datos a cifrar (objeto o string)
     * @param {string} secretKey - Clave secreta para cifrar (debe estar en .env)
     * @returns {string} - String cifrado en formato hex:iv:encrypted
     */
    static encrypt(data, secretKey = null) {
        try {
            // Usar la clave secreta del .env o una por defecto
            const key = secretKey || process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production-32-chars!!';
            
            // Convertir objeto a string JSON si es necesario
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Generar IV (Initialization Vector) aleatorio
            const iv = crypto.randomBytes(16);
            
            // Crear cipher
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32).padEnd(32, '0')), iv);
            
            // Cifrar los datos
            let encrypted = cipher.update(dataString, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            // Retornar en formato: iv:encrypted
            return iv.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Error al cifrar:', error);
            throw new Error('Error al cifrar los datos');
        }
    }

    /**
     * Descifra un string cifrado
     * @param {string} encryptedData - String cifrado en formato hex:iv:encrypted
     * @param {string} secretKey - Clave secreta para descifrar
     * @returns {*} - Datos descifrados (objeto o string)
     */
    static decrypt(encryptedData, secretKey = null) {
        try {
            const key = secretKey || process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production-32-chars!!';
            
            // Separar IV y datos cifrados
            const parts = encryptedData.split(':');
            if (parts.length !== 2) {
                throw new Error('Formato de datos cifrados inválido');
            }
            
            const iv = Buffer.from(parts[0], 'hex');
            const encrypted = parts[1];
            
            // Crear decipher
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32).padEnd(32, '0')), iv);
            
            // Descifrar
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            // Intentar parsear como JSON, si falla retornar como string
            try {
                return JSON.parse(decrypted);
            } catch {
                return decrypted;
            }
        } catch (error) {
            console.error('Error al descifrar:', error);
            throw new Error('Error al descifrar los datos');
        }
    }

    /**
     * Cifra un objeto completo (útil para respuestas de API)
     * @param {Object} responseData - Objeto con estado, mensaje, data
     * @param {boolean} encryptDataOnly - Si true, solo cifra el campo 'data', si false cifra todo
     * @returns {Object} - Objeto con los datos cifrados
     */
    static encryptResponse(responseData, encryptDataOnly = true) {
        if (encryptDataOnly && responseData.data) {
            return {
                estado: responseData.estado,
                mensaje: responseData.mensaje,
                data: this.encrypt(responseData.data)
            };
        } else {
            return {
                estado: this.encrypt(responseData.estado),
                mensaje: this.encrypt(responseData.mensaje),
                data: this.encrypt(responseData.data)
            };
        }
    }
}

module.exports = Encryption;

