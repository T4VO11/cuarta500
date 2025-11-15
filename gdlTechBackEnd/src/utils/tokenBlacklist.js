/**
 * Utilidad para manejar la blacklist de tokens JWT invalidados
 * Almacena tokens que han sido invalidados mediante logout
 * 
 * NOTA: En producción, esto debería implementarse con Redis o una base de datos
 * para persistir entre reinicios del servidor y compartir entre múltiples instancias
 */

class TokenBlacklist {
    constructor() {
        // Set para almacenar tokens invalidados
        // En producción, usar Redis o MongoDB
        this.blacklistedTokens = new Set();
        
        // Limpiar tokens expirados periódicamente (cada hora)
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredTokens();
        }, 60 * 60 * 1000); // 1 hora
    }

    /**
     * Agrega un token a la blacklist
     * @param {string} token - Token JWT a invalidar
     * @param {number} expiresIn - Tiempo de expiración en segundos (opcional, para limpieza automática)
     * @returns {boolean} - true si se agregó correctamente
     */
    add(token) {
        try {
            this.blacklistedTokens.add(token);
            return true;
        } catch (error) {
            console.error('Error al agregar token a blacklist:', error);
            return false;
        }
    }

    /**
     * Verifica si un token está en la blacklist
     * @param {string} token - Token JWT a verificar
     * @returns {boolean} - true si el token está en la blacklist
     */
    has(token) {
        return this.blacklistedTokens.has(token);
    }

    /**
     * Elimina un token de la blacklist (útil para testing o casos especiales)
     * @param {string} token - Token JWT a remover
     * @returns {boolean} - true si se removió correctamente
     */
    remove(token) {
        return this.blacklistedTokens.delete(token);
    }

    /**
     * Limpia todos los tokens de la blacklist
     * Útil para testing o reinicio del sistema
     */
    clear() {
        this.blacklistedTokens.clear();
    }

    /**
     * Obtiene el tamaño actual de la blacklist
     * @returns {number} - Número de tokens en la blacklist
     */
    size() {
        return this.blacklistedTokens.size;
    }

    /**
     * Limpia tokens expirados de la blacklist
     * Nota: Esta es una implementación básica. En producción con Redis,
     * los tokens expirarían automáticamente usando TTL.
     */
    cleanupExpiredTokens() {
        // En una implementación con Redis, esto se manejaría automáticamente
        // con TTL. Aquí solo limpiamos si el Set es muy grande.
        const maxSize = 10000; // Límite razonable para desarrollo
        if (this.blacklistedTokens.size > maxSize) {
            console.log(`Blacklist muy grande (${this.blacklistedTokens.size}), limpiando...`);
            // En producción, esto debería verificar la expiración real de cada token
            // Por ahora, solo limpiamos si excede un tamaño razonable
            this.blacklistedTokens.clear();
        }
    }

    /**
     * Detiene el intervalo de limpieza (útil para testing)
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// Exportar una instancia singleton
module.exports = new TokenBlacklist();

