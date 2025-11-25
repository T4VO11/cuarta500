/**
 * Utilidad para construir URLs completas de imágenes
 * Asegura que siempre se incluya el protocolo y host completo
 */
const buildImageUrl = (req, imagePath) => {
    if (!imagePath) return '';
    console.log('buildImageUrl - imagePath:', imagePath);
    // Si ya es una URL completa, retornarla tal cual
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Construir URL completa
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    
    // Asegurar que la ruta no tenga doble slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    return `${protocol}://${host}/${cleanPath}`;
};

/**
 * Construir múltiples URLs de imágenes (para arrays)
 */
const buildImageUrls = (req, imagePaths) => {
    console.log('buildImageUrls - imagePaths:', imagePaths);
    if (!Array.isArray(imagePaths)) return imagePaths;
    
    return imagePaths.map(path => buildImageUrl(req, path));
};

module.exports = {
    buildImageUrl,
    buildImageUrls
};

