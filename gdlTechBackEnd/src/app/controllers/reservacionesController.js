const Reservacion = require('../../models/Reservacion');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

exports.index = async (req, res) => {
    try {
        const reservaciones = await Reservacion.find()
            .sort({ reservacion_id: -1 });

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reservaciones obtenidas exitosamente',
                data: reservaciones
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, reservaciones, 'Reservaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index reservaciones:', error);
        return JsonResponse.error(res, 'Error al obtener reservaciones', 500);
    }
};

exports.show = async (req, res) => {
    try {
        // Si el ID está vacío o es undefined, devolver error más descriptivo
        if (!req.params.id || req.params.id === 'undefined' || req.params.id === 'null') {
            return JsonResponse.error(res, 'ID no proporcionado', 400);
        }

        let reservacion;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            reservacion = await Reservacion.findById(req.params.id);
        }
        
        // Si no se encontró por ObjectId, intentar por reservacion_id
        if (!reservacion) {
            const reservacionIdNum = parseInt(req.params.id);
            if (!isNaN(reservacionIdNum)) {
                reservacion = await Reservacion.findOne({ reservacion_id: reservacionIdNum });
            }
        }

        // Validar que la reservación exista
        if (!reservacion) {
            return JsonResponse.notFound(res, 'Reservación no encontrada');
        }

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reservación obtenida exitosamente',
                data: reservacion
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, reservacion, 'Reservación obtenida exitosamente');
    } catch (error) {
        console.error('Error en show reservacion:', error);
        return JsonResponse.error(res, 'Error al obtener reservación', 500);
    }
};

exports.store = async (req, res) => {
    try {
        const {
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra,
            total,
            estado,
            estado_pago
        } = req.body;

        const reservacionExistente = await Reservacion.findOne({ reservacion_id });
        if (reservacionExistente) {
            return JsonResponse.error(res, 'El reservacion_id ya existe', 400);
        }

        const nuevaReservacion = new Reservacion({
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra: servicios_extra ? (Array.isArray(servicios_extra) ? servicios_extra : JSON.parse(servicios_extra)) : [],
            total,
            estado: estado || 'pendiente',
            estado_pago: estado_pago || 'pendiente'
        });

        await nuevaReservacion.save();

        return JsonResponse.success(res, nuevaReservacion, 'Reservación creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store reservacion:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El reservacion_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear reservación', 500);
    }
};

exports.update = async (req, res) => {
    try {
        let reservacion;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            reservacion = await Reservacion.findById(req.params.id);
        }
        
        // Si no se encontró por ObjectId, intentar por reservacion_id
        if (!reservacion) {
            const reservacionIdNum = parseInt(req.params.id);
            if (!isNaN(reservacionIdNum)) {
                reservacion = await Reservacion.findOne({ reservacion_id: reservacionIdNum });
            }
        }
        
        // Validar que la reservación exista
        if (!reservacion) {
            return JsonResponse.notFound(res, 'Reservación no encontrada');
        }

        const {
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra,
            total,
            estado,
            estado_pago
        } = req.body;

        if (nombre_residente) reservacion.nombre_residente = nombre_residente;
        if (telefono) reservacion.telefono = telefono;
        if (fecha_evento) reservacion.fecha_evento = fecha_evento;
        if (servicios_extra !== undefined) {
            try {
                reservacion.servicios_extra = Array.isArray(servicios_extra) ? servicios_extra : JSON.parse(servicios_extra);
            } catch {
                reservacion.servicios_extra = servicios_extra;
            }
        }
        if (total !== undefined) reservacion.total = total;
        if (estado) reservacion.estado = estado;
        if (estado_pago) reservacion.estado_pago = estado_pago;
        reservacion.updated_at = new Date();

        await reservacion.save();

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reservación actualizada exitosamente',
                data: reservacion
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, reservacion, 'Reservación actualizada exitosamente');
    } catch (error) {
        console.error('Error en update reservacion:', error);
        return JsonResponse.error(res, 'Error al actualizar reservación', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        let reservacion;
        
        // Intentar buscar por ObjectId primero
        if (mongoose.Types.ObjectId.isValid(req.params.id)) {
            reservacion = await Reservacion.findById(req.params.id);
            if (reservacion) {
                await Reservacion.findByIdAndDelete(req.params.id);
            }
        }
        
        // Si no se encontró por ObjectId, intentar por reservacion_id
        if (!reservacion) {
            const reservacionIdNum = parseInt(req.params.id);
            if (!isNaN(reservacionIdNum)) {
                reservacion = await Reservacion.findOne({ reservacion_id: reservacionIdNum });
                if (reservacion) {
                    await Reservacion.findByIdAndDelete(reservacion._id);
                }
            }
        }
        
        // Validar que la reservación exista
        if (!reservacion) {
            return JsonResponse.notFound(res, 'Reservación no encontrada');
        }

        return JsonResponse.success(res, null, 'Reservación eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy reservacion:', error);
        return JsonResponse.error(res, 'Error al eliminar reservación', 500);
    }
};

// Endpoint para usuarios normales: obtener todas las reservaciones (solo lectura)
exports.misReservaciones = async (req, res) => {
    try {
        const reservaciones = await Reservacion.find()
            .sort({ reservacion_id: -1 });

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reservaciones obtenidas exitosamente',
                data: reservaciones
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, reservaciones, 'Reservaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en misReservaciones:', error);
        return JsonResponse.error(res, 'Error al obtener reservaciones', 500);
    }
};

