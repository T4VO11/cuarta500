/**
 * Middleware para hacer opcionales los archivos en Multer
 * Esto permite que las rutas funcionen tanto con archivos como sin ellos
 */
const handleMulterError = (err, req, res, next) => {
    // Si el error es de Multer y es porque no hay archivos, lo ignoramos
    if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next();
    }
    // Si es otro error de Multer, lo pasamos
    if (err && err.name === 'MulterError') {
        return res.status(400).json({
            estado: 'error',
            mensaje: err.message,
            data: null
        });
    }
    // Para cualquier otro error, lo pasamos al siguiente middleware
    next(err);
};

module.exports = handleMulterError;

