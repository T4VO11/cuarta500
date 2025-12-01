const LocalAmenidad = require('../../models/local/Amenidad');
const AtlasAmenidad = require('../../models/atlas/Amenidad');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrls } = require('../../utils/imageUrlHelper');

const createDualWriter = require('../../utils/dualWriter')
const amenidadDW = createDualWriter(LocalAmenidad, AtlasAmenidad);

// ------------READS (index, show, disponibles usaran local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        console.log('index ');
        const amenidades = await LocalAmenidad.find({ condominio_id: 'C500' })
            .sort({ amenidad_id: 1 });

        // Construir URLs públicas para imágenes de galería
        const amenidadesConUrls = amenidades.map(amenidad => {
            const amenidadObj = amenidad.toObject();
            if (amenidadObj.reglas_apartado?.galeria_urls) {
                amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
            }
            return amenidadObj;
        });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Amenidades obtenidas exitosamente',
        //         data: amenidadesConUrls
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

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

        const amenidad = await LocalAmenidad.findById(req.params.id);

        if (!amenidad) {
            return JsonResponse.notFound(res, 'Amenidad no encontrada');
        }

        const amenidadObj = amenidad.toObject();
        if (amenidadObj.reglas_apartado?.galeria_urls) {
            amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Amenidad obtenida exitosamente',
        //         data: amenidadObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, amenidadObj, 'Amenidad obtenida exitosamente');
    } catch (error) {
        console.error('Error en show amenidad:', error);
        return JsonResponse.error(res, 'Error al obtener amenidad', 500);
    }
};

// ------------ CREATE (usando dualWriter) ------------ 
exports.store = async (req, res) => {
    try {
        const {
            amenidad_id, tipo, nombre, descripcion, estado,espacio_ref_id,
            usuario_id, motivo, catalogo_detalle, reglas_apartado, transaccion_detalle
        } = req.body;

        // Comprobación en local para amenidad_id único
        const amenidadExistente = await LocalAmenidad.findOne({ amenidad_id });
        if (amenidadExistente) {
            return JsonResponse.error(res, "El 'amenidad_id' ya existe", 400);
        }

        // Manejar archivos de galería si se suben
        let reglasApartadoData = reglas_apartado ? (typeof reglas_apartado === 'string' ? JSON.parse(reglas_apartado) : reglas_apartado) : {};
        if (req.files && req.files.galeria) {
            reglasApartadoData.galeria_urls = req.files.galeria.map(
                file => `uploads/amenidades/${file.filename}`
            );
        }

        // Construimos un objeto plano, en lugar de la instancia Mongoose
        const payload = {
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
        };
        
        // Usar dualWriter para crear en local e intentar en Atlas (en caso de fallas, encola)
        const nuevaAmenidadLocal = await amenidadDW.create(payload);

        const amenidadObj = nuevaAmenidadLocal.toObject();
        if (amenidadObj.reglas_apartado?.galeria_urls) {
            amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
        }
        
        return JsonResponse.success(res, amenidadObj, 'Amenidad creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store amenidad:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, "El 'amenidad_id' ya existe", 400);
        }
        return JsonResponse.error(res, 'Error al crear amenidad', 500);
    }
};

// ------------ UPDATE (usa dualWriter) ------------ 
exports.update = async (req, res) => {
    try {
        console.log('update');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        //Obtener el documento local actual para manejar merge de galeria
        const amenidad = await LocalAmenidad.findById(req.params.id);
        if (!amenidad) {
            return JsonResponse.notFound(res, 'Amenidad no encontrada');
        }

        const {
            tipo, nombre, descripcion, estado, espacio_ref_id,
            usuario_id, motivo, catalogo_detalle, reglas_apartado,
            transaccion_detalle
        } = req.body;

        // Preparamos updates para actualizar con dualWrite
        const updates = {};
        
        // Actualizamos campos simples
        if (tipo !== undefined) updates.tipo = tipo;
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (estado !== undefined) updates.estado = estado;
        if (motivo !== undefined) updates.motivo = motivo;
        if (espacio_ref_id !== undefined) updates.espacio_ref_id = espacio_ref_id;
        if (usuario_id !== undefined) updates.usuario_id = usuario_id;
        
        // Merge de catalogo_detalle (Mantiene lo existente y agrega lo nuevo)
        if (catalogo_detalle !== undefined) {
            let parsedDed = {};
            try {
                parseDet = typeof catalogo_detalle === 'string' ? JSON.parse(catalogo_detalle) : catalogo_detalle;
            } catch (e) { parsedDet = catalogo_detalle; }
            updates.catalogo_detalle = { ...(amenidad.catalogo_detalle || {}), ...parsedDet };
            }
            
        // Merge de transaccion_detalle
        if (transaccion_detalle !== undefined) {
            let parsedTrans = {};
            try {
                parsedTrans = typeof transaccion_detalle === 'string' ? JSON.parse(transaccion_detalle) : transaccion_detalle;
            } catch (e) { parsedTrans = transaccion_detalle; }
            updates.transaccion_detalle = { ...(amenidad.transaccion_detalle || {}), ...parsedTrans}
        }

        // Merge de reglas_apartado (Texto/JSON en el body)
        let reglasBody = {};
        if (reglas_apartado !== undefined) {
            try {
                reglasBody= typeof reglas_apartado === 'string' ? JSON.parse(reglas_apartado) : reglas_apartado;
            } catch (e) { reglasBody = reglas_apartado; }
            }

        updates.reglas_apartado = { ...(amenidad.reglas_apartado?.toObject() || {}), ...reglasBody };

        if (req.files && req.files.length > 0) {
            const nuevasUrls = req.files.map(file => `ulpoads/amenudades/${file.filename}`);

            updates.reglas_apartado.galeria_urls = [
                ...(amenidad.reglas_apartado?.galeria_urls || []),
                ...nuevasUrls
            ];
        }

        // Usar dualWriter.update -> actualiza el local y encola/actualiza Atlas si falla
        const updated = await amenidadDW.update(req.params.id, updates);

        const amenidadObj = updated.toObject();
        if (amenidadObj.reglas_apartado?.galeria_urls) {
            amenidadObj.reglas_apartado.galeria_urls = buildImageUrls(req, amenidadObj.reglas_apartado.galeria_urls);
        }
    return JsonResponse.success(res, amenidadObj, 'Amenidad actualizada exitosamente');
  } catch (error) {
    console.error('Error en update amenidad:', error);
    return JsonResponse.error(res, 'Error al actualizar amenidad', 500);
  }
};

// ------------ DELETE (usa dualWriter) ------------ 
exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const amenidad = await LocalAmenidad.findById(req.params.id);
        if (!amenidad) {
            return JsonResponse.notFound(res, 'Amenidad no encontrada');
        }

        await amenidadDW.delete(req.params.id);

        return JsonResponse.success(res, null, 'Amenidad eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy amenidad:', error);
        return JsonResponse.error(res, 'Error al eliminar amenidad', 500);
    }
};

// ------------ Endpoint para usuarios normales: GET disponibles (READ) ------------ 
exports.disponibles = async (req, res) => {
    try {
        // Obtener todas las amenidades del condominio (sin filtrar por estado)
        // El frontend puede decidir qué mostrar
        const amenidades = await LocalAmenidad.find({ 
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

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Amenidades disponibles obtenidas exitosamente',
        //         data: amenidadesConUrls
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, amenidadesConUrls, 'Amenidades disponibles obtenidas exitosamente');
    } catch (error) {
        console.error('Error en disponibles amenidades:', error);
        return JsonResponse.error(res, 'Error al obtener amenidades disponibles', 500);
    }
};

