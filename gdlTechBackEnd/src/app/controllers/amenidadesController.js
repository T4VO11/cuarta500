const Amenidad = require('../../models/Amenidad');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrls } = require('../../utils/imageUrlHelper');

exports.index = async (req, res) => {
    try {
        console.log('index ');
        const amenidades = await Amenidad.find({ condominio_id: 'C500' })
            .sort({ amenidad_id: 1 });

        // Construir URLs públicas para imágenes de galería
        const amenidadesConUrls = amenidades.map(amenidad => {
            const amenidadObj = amenidad.toObject();
            if (amenidadObj.reglas_apartado?.galeria_urls) {
                amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
            }
            return amenidadObj;
        });

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Amenidades obtenidas exitosamente',
                data: amenidadesConUrls
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, amenidadesConUrls, 'Amenidades obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index amenidades:', error);
        return JsonResponse.error(res, 'Error al obtener amenidades', 500);
    }
};

exports.show = async (req, res) => {
    try {
        console.log('SHOW ID de amenidad solicitado:');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const amenidad = await Amenidad.findById(req.params.id);

        if (!amenidad) {
            return JsonResponse.notFound(res, 'Amenidad no encontrada');
        }

        const amenidadObj = amenidad.toObject();
        if (amenidadObj.reglas_apartado?.galeria_urls) {
            amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
        }

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Amenidad obtenida exitosamente',
                data: amenidadObj
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, amenidadObj, 'Amenidad obtenida exitosamente');
    } catch (error) {
        console.error('Error en show amenidad:', error);
        return JsonResponse.error(res, 'Error al obtener amenidad', 500);
    }
};

exports.store = async (req, res) => {
    try {
      
        const {
            amenidad_id,
            tipo,
            nombre,
            descripcion,
            estado,
            espacio_ref_id,
            usuario_id,
            motivo,
            catalogo_detalle,
            reglas_apartado,
            transaccion_detalle
        } = req.body;

        const amenidadExistente = await Amenidad.findOne({ amenidad_id });
        if (amenidadExistente) {
            return JsonResponse.error(res, 'El amenidad_id ya existe', 400);
        }

        // Manejar archivos de galería si se suben
        let reglasApartadoData = reglas_apartado ? (typeof reglas_apartado === 'string' ? JSON.parse(reglas_apartado) : reglas_apartado) : {};
console.log('save req.files:', req.files);
console.log('save req.files.galeria:', req.files.galeria);
        if (req.files && req.files.galeria) {
  reglasApartadoData.galeria_urls = req.files.galeria.map(
    file => `uploads/amenidades/${file.filename}`
  );
        }

        const nuevaAmenidad = new Amenidad({
            amenidad_id,
            condominio_id: 'C500',
            tipo,
            nombre,
            descripcion: descripcion || '',
            estado: estado || 'activo',
            motivo: motivo || '',
            espacio_ref_id: espacio_ref_id || null,
            usuario_id: usuario_id || null,
            catalogo_detalle: catalogo_detalle ? (typeof catalogo_detalle === 'string' ? JSON.parse(catalogo_detalle) : catalogo_detalle) : {},
            reglas_apartado: reglasApartadoData,
            transaccion_detalle: transaccion_detalle ? (typeof transaccion_detalle === 'string' ? JSON.parse(transaccion_detalle) : transaccion_detalle) : {}
        });
console.log('Nueva Amenidad antes de guardar:', nuevaAmenidad);
        await nuevaAmenidad.save();

        const amenidadObj = nuevaAmenidad.toObject();
        if (amenidadObj.reglas_apartado?.galeria_urls) {
            amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
        }

        return JsonResponse.success(res, amenidadObj, 'Amenidad creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store amenidad:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El amenidad_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear amenidad', 500);
    }
};

exports.update = async (req, res) => {
    try {
        console.log('update ');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const amenidad = await Amenidad.findById(req.params.id);
        if (!amenidad) {
            return JsonResponse.notFound(res, 'Amenidad no encontrada');
        }

        const {
            tipo,
            nombre,
            descripcion,
            estado,
            espacio_ref_id,
            usuario_id,
            motivo,
            catalogo_detalle,
            reglas_apartado,
            transaccion_detalle
        } = req.body;

        // Manejar archivos de galería si se suben
       if (req.files && req.files.length > 0) { // Comprobar si hay archivos subidos
    
    // Asumimos que todos los archivos en req.files son de la galería
    const nuevasUrls = req.files.map(
    file => `uploads/amenidades/${file.filename}`
        );
    // Verificamos si reglas_apartado existe y concatenamos
    if (amenidad.reglas_apartado) {
        // Concatenar las URLs viejas con las nuevas (las viejas están en amenidad.reglas_apartado.galeria_urls)
        amenidad.reglas_apartado.galeria_urls = [
            ...(amenidad.reglas_apartado.galeria_urls || []),
            ...nuevasUrls
        ];
    } else {
        // Si reglas_apartado no existe, lo inicializamos con la galería
        amenidad.reglas_apartado = { galeria_urls: nuevasUrls };
    }
}

        if (tipo) amenidad.tipo = tipo;
        if (nombre) amenidad.nombre = nombre;
        if (descripcion !== undefined) amenidad.descripcion = descripcion;
        if (estado) amenidad.estado = estado;
        if (motivo !== undefined) amenidad.motivo = motivo;
        if (espacio_ref_id !== undefined && espacio_ref_id !== null) { 
            amenidad.espacio_ref_id = espacio_ref_id;
            }
        if (usuario_id !== undefined && usuario_id !== null) {
            amenidad.usuario_id = usuario_id;
            }
        if (catalogo_detalle) {
            try {
                amenidad.catalogo_detalle = { ...amenidad.catalogo_detalle, ...JSON.parse(catalogo_detalle) };
            } catch {
                amenidad.catalogo_detalle = { ...amenidad.catalogo_detalle, ...catalogo_detalle };
            }
        }
        if (reglas_apartado) {
            try {
                const reglasData = typeof reglas_apartado === 'string' ? JSON.parse(reglas_apartado) : reglas_apartado;
                Object.assign(amenidad.reglas_apartado, reglasData);
            } catch {
                amenidad.reglas_apartado = { ...amenidad.reglas_apartado, ...reglas_apartado };
            }
        }
        if (transaccion_detalle) {
            try {
                const transaccionData = typeof transaccion_detalle === 'string' ? JSON.parse(transaccion_detalle) : transaccion_detalle;
                amenidad.transaccion_detalle = { ...amenidad.transaccion_detalle, ...transaccionData };
            } catch {
                amenidad.transaccion_detalle = { ...amenidad.transaccion_detalle, ...transaccion_detalle };
            }
        }
console.log('Amenidad antes de guardar:', amenidad);
        await amenidad.save();

        const amenidadObj = amenidad.toObject();
        if (amenidadObj.reglas_apartado?.galeria_urls) {
            amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
        }

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Amenidad actualizada exitosamente',
                data: amenidadObj
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, amenidadObj, 'Amenidad actualizada exitosamente');
    } catch (error) {
        console.error('Error en update amenidad:', error);
        return JsonResponse.error(res, 'Error al actualizar amenidad', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const amenidad = await Amenidad.findById(req.params.id);
        if (!amenidad) {
            return JsonResponse.notFound(res, 'Amenidad no encontrada');
        }

        await Amenidad.findByIdAndDelete(req.params.id);

        return JsonResponse.success(res, null, 'Amenidad eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy amenidad:', error);
        return JsonResponse.error(res, 'Error al eliminar amenidad', 500);
    }
};

// Endpoint para usuarios normales: obtener amenidades disponibles
exports.disponibles = async (req, res) => {
    try {
        // Obtener todas las amenidades del condominio (sin filtrar por estado)
        // El frontend puede decidir qué mostrar
        const amenidades = await Amenidad.find({ 
            condominio_id: 'C500'
        })
        .sort({ amenidad_id: 1 });

        // Construir URLs públicas para imágenes de galería
        const amenidadesConUrls = amenidades.map(amenidad => {
            const amenidadObj = amenidad.toObject();
            if (amenidadObj.reglas_apartado?.galeria_urls) {
                amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
            }
            return amenidadObj;
        });

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Amenidades disponibles obtenidas exitosamente',
                data: amenidadesConUrls
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, amenidadesConUrls, 'Amenidades disponibles obtenidas exitosamente');
    } catch (error) {
        console.error('Error en disponibles amenidades:', error);
        return JsonResponse.error(res, 'Error al obtener amenidades disponibles', 500);
    }
};

