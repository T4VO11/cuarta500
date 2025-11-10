const Incidente = require('../../models/Incidente'); // RUTA CORREGIDA
// Asumo que tienes una lógica para borrar la imagen de S3/local si falla la validación
// const { borrarImagen } = require('../utils/file.helpers'); 

exports.crearIncidente = async (req, res) => {
    // 1. Obtenemos datos del body y del usuario autenticado (JWT)
    const { titulo, descripcion } = req.body;
    const { id: autorId, condominioId } = req.usuario; // Sacado del token

    try {
        // 2. Verificamos si se subió una imagen
        if (!req.file) {
            // Lo hacemos opcional según el modelo
            // return res.status(400).json({ msg: 'La imagen es requerida para el incidente' });
        }

        // 3. Obtenemos la URL/path de la imagen
        // Si usas S3, multer-s3 te dará 'req.file.location'
        // Si usas local (no recomendado), será 'req.file.path'
        const imageUrl = req.file ? (req.file.location || req.file.path) : null;

        // 4. Creamos el incidente
        const nuevoIncidente = new Incidente({
            titulo,
            descripcion,
            imageUrl,
            autorId,
            condominioId
        });

        // 5. Guardamos en BD
        await nuevoIncidente.save();

        res.status(201).json({ msg: 'Incidente reportado exitosamente', incidente: nuevoIncidente });

    } catch (error) {
        console.error(error);
        // Si hay un error de BD, pero la imagen ya se subió, deberíamos borrarla
        // if (req.file) { await borrarImagen(req.file.key); } // Lógica de S3
        res.status(500).send('Error en el servidor');
    }
};

// Obtener incidentes de MI condominio
exports.obtenerIncidentesPorCondominio = async (req, res) => {
    try {
        const { condominioId } = req.usuario; // Del token

        const incidentes = await Incidente.find({ condominioId })
                                         .populate('autorId', 'nombre email') // Trae los datos del autor
                                         .sort({ createdAt: -1 }); // Más recientes primero

        res.json(incidentes);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
    }
};