const LocalBitacora = require('../../models/local/Bitacora');
const AtlasBitacora = require('../../models/atlas/Bitacora');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');

const createDualWriter = require('../../utils/dualWriter');
const bitacoraDW = createDualWriter(LocalBitacora, AtlasBitacora)

// ------------READS  (Con local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        const bitacoras = await LocalBitacora.find({ condominio_id: 'C500' })
            .sort({ registro_id: -1 });

        const bitacorasConUrls = bitacoras.map(bitacora => {
            const bitacoraObj = bitacora.toObject();
            if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
                bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(req, bitacoraObj.detalle_acceso.imagen_ine_url);
            }
            return bitacoraObj;
        });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Bitácoras obtenidas exitosamente',
        //         data: bitacorasConUrls
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, bitacorasConUrls, 'Bitácoras obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index bitacoras:', error);
        return JsonResponse.error(res, 'Error al obtener bitácoras', 500);
    }
};

exports.show = async (req, res) => {
    try {
        console.log('SHOW ID de bitacora solicitado:');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const bitacora = await LocalBitacora.findById(req.params.id);

        if (!bitacora) {
            return JsonResponse.notFound(res, 'Bitácora no encontrada');
        }

        const bitacoraObj = bitacora.toObject();
        if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
            bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(req, bitacoraObj.detalle_acceso.imagen_ine_url);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Bitácora obtenida exitosamente',
        //         data: bitacoraObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, bitacoraObj, 'Bitácora obtenida exitosamente');
    } catch (error) {
        console.error('Error en show bitacora:', error);
        return JsonResponse.error(res, 'Error al obtener bitácora', 500);
    }
};

// CREATE (usando dualWriter)
exports.store = async (req, res) => {
    try {
        const {
            registro_id,
            tipo_registro,
            fecha_hora,
            accion,
            usuario_id,
            invitacion_id,
            detalle_acceso,
            vehiculo
        } = req.body;

        //Validacion de registro_id unico
        const bitacoraExistente = await LocalBitacora.findOne({ registro_id });
        if (bitacoraExistente) {
            return JsonResponse.error(res, 'El registro_id ya existe', 400);
        }

        // Parse del detalle_acceso
        let detalleAccesoData = {};
        
        if (detalle_acceso !== undefined) {
            try {
                detalleAccesoData = typeof detalle_acceso === "string" ? JSON.parse(detalle_acceso) : detalle_acceso;
            } catch {
                detalleAccesoData = detalle_acceso;
            }
        }

        if (req.file) {
            detalleAccesoData.imagen_ine_url = `uploads/bitacoras/${req.file.filename}`;
        }

        // Si el tipo es visita_no_esperada, el vehiculo puede estar en detalle_acceso
        if (tipo_registro === 'visita_no_esperada' && vehiculo) {
            try {
                detalleAccesoData.vehiculo = typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo;                
            } catch {
                detalleAccesoData.vehiculo = vehiculo;
            }
        }

        // Vehiculo normal
        let vehiculoData = {};

        if (tipo_registro !== "visita_no_esperada" && vehiculo) {
            try {
                vehiculoData = typeof vehiculo === "string" ? JSON.parse(vehiculo) : vehiculo;
            } catch {
                vehiculoData = vehiculo;
            }
        }
        
        // Construimos el objeto plano, en lugar de la instancia mongoose
        const payload ={
            registro_id,
            condominio_id: 'C500',
            tipo_registro,
            fecha_hora,
            accion,
            usuario_id,
            invitacion_id: invitacion_id || null,
            detalle_acceso: detalleAccesoData,
            vehiculo: vehiculoData
        };

        // Usar dualWriter para crear en local e intentar en Atlas (en caso de fallas, encola)
        const nuevaBitacoraLocal = await bitacoraDW.create(payload);

        const bitacoraObj = nuevaBitacoraLocal.toObject();
        if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
            bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(req, bitacoraObj.detalle_acceso.imagen_ine_url);
        }

        return JsonResponse.success(res, bitacoraObj, 'Bitácora creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store bitacora:', error);
        if ( error.code === 11000) {
            return JsonResponse.error(res, "El 'registro_id' ya existe", 400);
        }
        return JsonResponse.error(res, 'Error al crear bitácora', 500);
    }
};

// UPDATE (dualWriter)
exports.update = async (req, res) => {
    try {
        console.log('update');
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        // Obtenemos el documento local para manejar merges
        const bitacora = await LocalBitacora.findById(id);
        if (!bitacora) {
            return JsonResponse.notFound(res, 'Bitácora no encontrada');
        }

        const { 
            tipo_registro, fecha_hora, accion, usuario_id,
            invitacion_id, detalle_acceso, vehiculo
        } = req.body;

        // ====== DETALLE ACCESO ======
        let detalleAcceso = bitacora.detalle_acceso ? bitacora.detalle_acceso.toObject() : {};

        // Imagen
        if (req.file) {
            detalleAcceso.imagen_ine_url = `uploads/bitacoras/${req.file.filename}`;            
        }

        if (detalle_acceso !== undefined) {
            try {
                const parsed = typeof detalle_acceso === "string" 
                    ? JSON.parse(detalle_acceso) 
                    : detalle_acceso;

                detalleAcceso = { ...detalleAcceso, ...parsed };
            } catch {
                detalleAcceso = { ...detalleAcceso, ...detalle_acceso };
            }
        }

        // ====== VEHICULO ======
        let vehiculoData = bitacora.vehiculo ? bitacora.vehiculo.toObject() : {};

        if (vehiculo !== undefined) {
            try {
                const parsedV = typeof vehiculo === "string" 
                    ? JSON.parse(vehiculo) 
                    : vehiculo;

                if (tipo_registro === "visita_no_esperada") {
                    detalleAcceso.vehiculo = {
                        ...(detalleAcceso.vehiculo || {}),
                        ...parsedV
                    };
                    vehiculoData = {};
                } else {
                    vehiculoData = { ...vehiculoData, ...parsedV };
                }
            } catch {
                if (tipo_registro === "visita_no_esperada") {
                    detalleAcceso.vehiculo = {
                        ...(detalleAcceso.vehiculo || {}),
                        ...vehiculo
                    };
                    vehiculoData = {};
                } else {
                    vehiculoData = {
                        ...vehiculoData,
                        ...vehiculo
                    };
                }
            }
        }

        // ====== CONSTRUIR UPDATES ======
        const updates = {};
        updates.condominio_id = 'C500';
        if (tipo_registro !== undefined) updates.tipo_registro = tipo_registro;
        if (fecha_hora !== undefined) updates.fecha_hora = fecha_hora;
        if (accion !== undefined) updates.accion = accion;
        if (usuario_id !== undefined) updates.usuario_id = usuario_id;
        if (invitacion_id !== undefined) updates.invitacion_id = invitacion_id;

        updates.detalle_acceso = detalleAcceso;
        updates.vehiculo = vehiculoData;

        // dualWrite
        const updated = await bitacoraDW.update(id, updates);

        const bitacoraObj = updated.toObject();

        if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
            bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(
                req,
                bitacoraObj.detalle_acceso.imagen_ine_url
            );
        }

        return JsonResponse.success(res, bitacoraObj, 'Bitácora actualizada exitosamente');

    } catch (error) {
        console.error('Error en update bitacora: ', error);
        return JsonResponse.error(res, 'Error al actualizar bitácora', 500);
    }
};


// DELETE (DualWriter)


exports.destroy = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const bitacora = await LocalBitacora.findById(id);
        if (!bitacora) {
            return JsonResponse.notFound(res, 'Bitácora no encontrada');
        }

        await bitacoraDW.delete(id);

        return JsonResponse.success(res, null, 'Bitácora eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy bitacora:', error);
        return JsonResponse.error(res, 'Error al eliminar bitácora', 500);
    };
};


    // READ HISTORIAL DEL USUARIO (solo Local - conexion mas rapida)
// Endpoint para usuarios normales: obtener historial de accesos del usuario autenticado
exports.miHistorial = async (req, res) => {
    try {
        const usuario_id = req.usuario?.usuario_id;
        
        // Obtener usuario_id del token JWT        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        const usuarioIdNum = Number(usuario_id);
        
        // Buscar bitácoras relacionadas con el usuario (accesos, invitaciones, etc.)
        const bitacoras = await LocalBitacora.find({
            $and: [
                {
                    $or: [
                        { usuario_id: usuarioIdNum },
                        { 'detalle_acceso.usuario_id': usuarioIdNum }
                    ]
                },
                {
                    condominio_id: 'C500'
                },
                {
                    $or: [
                        { tipo_registro: { $in: ['acceso_qr', 'invitacion', 'visita', 'acceso'] } },
                        { 'detalle_acceso.codigo_acceso': { $exists: true, $ne: '' } }
                    ]
                }
            ]
        })
        .sort({ fecha_hora: -1, registro_id: -1 })
        .limit(100); // Limitar a los últimos 100 registros

        const bitacorasConUrls = bitacoras.map(bitacora => {
            const bitacoraObj = bitacora.toObject();
            if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
                bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(req, bitacoraObj.detalle_acceso.imagen_ine_url);
            }
            return bitacoraObj;
        });

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Historial de accesos obtenido exitosamente',
                data: bitacorasConUrls
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, bitacorasConUrls, 'Historial de accesos obtenido exitosamente');
    } catch (error) {
        console.error('Error en miHistorial:', error);
        return JsonResponse.error(res, 'Error al obtener historial de accesos', 500);
    }
};
