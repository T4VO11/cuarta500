const Bitacora = require('../../models/Bitacora');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');

exports.index = async (req, res) => {
    try {
        const bitacoras = await Bitacora.find({ condominio_id: 'C500' })
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const bitacora = await Bitacora.findById(req.params.id);

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

        const bitacoraExistente = await Bitacora.findOne({ registro_id });
        if (bitacoraExistente) {
            return JsonResponse.error(res, 'El registro_id ya existe', 400);
        }

        let detalleAccesoData = detalle_acceso ? (typeof detalle_acceso === 'string' ? JSON.parse(detalle_acceso) : detalle_acceso) : {};
        if (req.file) {
            detalleAccesoData.imagen_ine_url = `uploads/bitacoras/${req.file.filename}`;
        }

        // Si el tipo es visita_no_esperada, el vehiculo puede estar en detalle_acceso
        if (tipo_registro === 'visita_no_esperada' && vehiculo && !detalleAccesoData.vehiculo) {
            detalleAccesoData.vehiculo = typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo;
        }

        const nuevaBitacora = new Bitacora({
            registro_id,
            condominio_id: 'C500',
            tipo_registro,
            fecha_hora,
            accion,
            usuario_id,
            invitacion_id: invitacion_id || null,
            detalle_acceso: detalleAccesoData,
            vehiculo: vehiculo && tipo_registro !== 'visita_no_esperada' ? (typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo) : {}
        });

        await nuevaBitacora.save();

        const bitacoraObj = nuevaBitacora.toObject();
        if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
            bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(req, bitacoraObj.detalle_acceso.imagen_ine_url);
        }

        return JsonResponse.success(res, bitacoraObj, 'Bitácora creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store bitacora:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El registro_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear bitácora', 500);
    }
};

exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const bitacora = await Bitacora.findById(req.params.id);
        if (!bitacora) {
            return JsonResponse.notFound(res, 'Bitácora no encontrada');
        }

        const {
            tipo_registro,
            fecha_hora,
            accion,
            usuario_id,
            invitacion_id,
            detalle_acceso,
            vehiculo
        } = req.body;

        if (req.file) {
            if (!bitacora.detalle_acceso) bitacora.detalle_acceso = {};
            bitacora.detalle_acceso.imagen_ine_url = `uploads/bitacoras/${req.file.filename}`;
        }

        if (tipo_registro) bitacora.tipo_registro = tipo_registro;
        if (fecha_hora) bitacora.fecha_hora = fecha_hora;
        if (accion) bitacora.accion = accion;
        if (usuario_id !== undefined) bitacora.usuario_id = usuario_id;
        if (invitacion_id !== undefined) bitacora.invitacion_id = invitacion_id;
        if (detalle_acceso) {
            try {
                const detalleData = typeof detalle_acceso === 'string' ? JSON.parse(detalle_acceso) : detalle_acceso;
                bitacora.detalle_acceso = { ...bitacora.detalle_acceso, ...detalleData };
            } catch {
                bitacora.detalle_acceso = { ...bitacora.detalle_acceso, ...detalle_acceso };
            }
        }
        // Si el tipo es visita_no_esperada, el vehiculo va en detalle_acceso
        if (tipo_registro === 'visita_no_esperada' && vehiculo) {
            try {
                const vehiculoData = typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo;
                if (!bitacora.detalle_acceso) bitacora.detalle_acceso = {};
                bitacora.detalle_acceso.vehiculo = { ...bitacora.detalle_acceso.vehiculo, ...vehiculoData };
            } catch {
                if (!bitacora.detalle_acceso) bitacora.detalle_acceso = {};
                bitacora.detalle_acceso.vehiculo = { ...bitacora.detalle_acceso.vehiculo, ...vehiculo };
            }
        } else if (vehiculo) {
            try {
                const vehiculoData = typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo;
                bitacora.vehiculo = { ...bitacora.vehiculo, ...vehiculoData };
            } catch {
                bitacora.vehiculo = { ...bitacora.vehiculo, ...vehiculo };
            }
        }

        await bitacora.save();

        const bitacoraObj = bitacora.toObject();
        if (bitacoraObj.detalle_acceso?.imagen_ine_url) {
            bitacoraObj.detalle_acceso.imagen_ine_url = buildImageUrl(req, bitacoraObj.detalle_acceso.imagen_ine_url);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Bitácora actualizada exitosamente',
        //         data: bitacoraObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, bitacoraObj, 'Bitácora actualizada exitosamente');
    } catch (error) {
        console.error('Error en update bitacora:', error);
        return JsonResponse.error(res, 'Error al actualizar bitácora', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const bitacora = await Bitacora.findById(req.params.id);
        if (!bitacora) {
            return JsonResponse.notFound(res, 'Bitácora no encontrada');
        }

        await Bitacora.findByIdAndDelete(req.params.id);

        return JsonResponse.success(res, null, 'Bitácora eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy bitacora:', error);
        return JsonResponse.error(res, 'Error al eliminar bitácora', 500);
    }
};

// Endpoint para usuarios normales: obtener historial de accesos del usuario autenticado
exports.miHistorial = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT
        const usuario_id = req.usuario?.usuario_id;
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        const usuarioIdNum = Number(usuario_id);
        
        // Buscar bitácoras relacionadas con el usuario (accesos, invitaciones, etc.)
        const bitacoras = await Bitacora.find({
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