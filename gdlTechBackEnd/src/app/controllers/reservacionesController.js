const Reservacion = require('../../models/Reservacion');
const Usuario = require('../../models/Usuario');
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

        // Obtener usuario_id del token si está disponible (para admins que crean reservaciones)
        const usuario_id = req.usuario?.usuario_id;

        const nuevaReservacion = new Reservacion({
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra: servicios_extra ? (Array.isArray(servicios_extra) ? servicios_extra : JSON.parse(servicios_extra)) : [],
            total,
            estado: estado || 'pendiente',
            estado_pago: estado_pago || 'pendiente',
            usuario_id: usuario_id || null
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

// Endpoint para usuarios normales: crear reservación
exports.crear = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT
        const usuario_id = req.usuario?.usuario_id;
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
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

        // Generar el siguiente reservacion_id
        const ultimaReservacion = await Reservacion.findOne().sort({ reservacion_id: -1 });
        let reservacion_id = ultimaReservacion ? ultimaReservacion.reservacion_id + 1 : 1;

        // Verificar que no exista (por si acaso)
        const reservacionExistente = await Reservacion.findOne({ reservacion_id });
        if (reservacionExistente) {
            // Si existe, buscar el siguiente disponible
            while (await Reservacion.findOne({ reservacion_id })) {
                reservacion_id++;
            }
        }

        // Convertir usuario_id a Number para asegurar que coincida con el tipo en la BD
        const usuarioIdNum = Number(usuario_id);
        
        const nuevaReservacion = new Reservacion({
            reservacion_id,
            nombre_residente,
            telefono,
            fecha_evento,
            servicios_extra: servicios_extra ? (Array.isArray(servicios_extra) ? servicios_extra : JSON.parse(servicios_extra)) : [],
            total,
            estado: estado || 'pendiente',
            estado_pago: estado_pago || 'pendiente',
            usuario_id: usuarioIdNum
        });

        await nuevaReservacion.save();

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reservación creada exitosamente',
                data: nuevaReservacion
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, nuevaReservacion, 'Reservación creada exitosamente', 201);
    } catch (error) {
        console.error('Error en crear reservacion:', error);
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

// Endpoint para usuarios normales: obtener reservaciones del usuario autenticado
exports.misReservaciones = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT (viene en req.usuario del middleware de autenticación)
        const usuario_id = req.usuario?.usuario_id;
        
        console.log('misReservaciones - req.usuario:', req.usuario);
        console.log('misReservaciones - usuario_id:', usuario_id);
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        // Convertir usuario_id a Number para asegurar que coincida con el tipo en la BD
        const usuarioIdNum = Number(usuario_id);
        
        if (isNaN(usuarioIdNum)) {
            console.error('misReservaciones - usuario_id no es un número válido:', usuario_id);
            return JsonResponse.error(res, 'ID de usuario inválido', 400);
        }
        
        // Obtener datos del usuario autenticado para comparar por nombre/telefono si no hay usuario_id
        const usuario = await Usuario.findOne({ usuario_id: usuarioIdNum });
        let nombreCompletoUsuario = null;
        let telefonoUsuario = null;
        
        if (usuario) {
            nombreCompletoUsuario = `${usuario.nombre} ${usuario.apellido_paterno} ${usuario.apellido_materno}`.trim().toLowerCase();
            telefonoUsuario = usuario.telefono;
            console.log('misReservaciones - Usuario encontrado:', {
                usuario_id: usuarioIdNum,
                nombre_completo: nombreCompletoUsuario,
                telefono: telefonoUsuario
            });
        } else {
            console.warn('misReservaciones - Usuario no encontrado en BD para usuario_id:', usuarioIdNum);
        }
        
        // Buscar reservaciones de dos formas:
        // 1. Por usuario_id (reservaciones nuevas)
        // 2. Por nombre_residente o telefono (reservaciones antiguas sin usuario_id)
        const queryPorUsuarioId = { usuario_id: usuarioIdNum };
        
        // Construir query alternativa para reservaciones sin usuario_id
        const queryAlternativa = {
            $and: [
                { $or: [
                    { usuario_id: { $exists: false } },
                    { usuario_id: null },
                    { usuario_id: undefined }
                ]}
            ]
        };
        
        // Si tenemos datos del usuario, agregar condiciones de nombre o teléfono
        if (nombreCompletoUsuario || telefonoUsuario) {
            const condicionesNombreTelefono = [];
            if (nombreCompletoUsuario) {
                condicionesNombreTelefono.push({ 
                    nombre_residente: { $regex: new RegExp(nombreCompletoUsuario.split(' ')[0], 'i') } 
                });
            }
            if (telefonoUsuario) {
                condicionesNombreTelefono.push({ telefono: telefonoUsuario });
            }
            if (condicionesNombreTelefono.length > 0) {
                queryAlternativa.$and.push({ $or: condicionesNombreTelefono });
            }
        }
        
        // Buscar reservaciones con usuario_id
        const reservacionesPorUsuarioId = await Reservacion.find(queryPorUsuarioId)
            .sort({ reservacion_id: -1 });
        
        // Buscar reservaciones sin usuario_id pero que coincidan por nombre o teléfono
        let reservacionesPorNombreTelefono = [];
        if (nombreCompletoUsuario || telefonoUsuario) {
            reservacionesPorNombreTelefono = await Reservacion.find(queryAlternativa)
                .sort({ reservacion_id: -1 });
        }
        
        // Combinar ambas búsquedas y eliminar duplicados
        const todasLasReservaciones = [...reservacionesPorUsuarioId, ...reservacionesPorNombreTelefono];
        const reservacionesUnicas = todasLasReservaciones.filter((r, index, self) => 
            index === self.findIndex((res) => res._id.toString() === r._id.toString())
        );
        
        console.log(`misReservaciones - Encontradas ${reservacionesPorUsuarioId.length} por usuario_id, ${reservacionesPorNombreTelefono.length} por nombre/teléfono, ${reservacionesUnicas.length} totales únicas`);
        
        // Validar que todas las reservaciones devueltas pertenezcan al usuario
        const reservacionesValidadas = reservacionesUnicas.filter(r => {
            // Si tiene usuario_id, debe coincidir
            if (r.usuario_id !== null && r.usuario_id !== undefined) {
                const rUsuarioId = Number(r.usuario_id);
                if (!isNaN(rUsuarioId) && rUsuarioId === usuarioIdNum) {
                    return true;
                }
                return false;
            }
            
            // Si no tiene usuario_id, verificar por nombre o teléfono
            if (nombreCompletoUsuario) {
                const nombreReserva = (r.nombre_residente || '').toLowerCase();
                const nombreUsuarioPrimero = nombreCompletoUsuario.split(' ')[0];
                if (nombreReserva.includes(nombreUsuarioPrimero)) {
                    // Actualizar la reservación con el usuario_id para futuras búsquedas
                    r.usuario_id = usuarioIdNum;
                    r.save().catch(err => console.error('Error al actualizar usuario_id en reservación:', err));
                    return true;
                }
            }
            
            if (telefonoUsuario && r.telefono === telefonoUsuario) {
                // Actualizar la reservación con el usuario_id para futuras búsquedas
                r.usuario_id = usuarioIdNum;
                r.save().catch(err => console.error('Error al actualizar usuario_id en reservación:', err));
                return true;
            }
            
            return false;
        });
        
        console.log(`misReservaciones - Reservaciones validadas: ${reservacionesValidadas.length} de ${reservacionesUnicas.length}`);
        
        // SIEMPRE devolver solo las reservaciones validadas
        const reservacionesFinales = reservacionesValidadas;

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reservaciones obtenidas exitosamente',
                data: reservacionesFinales
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

        return JsonResponse.success(res, reservacionesFinales, 'Reservaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en misReservaciones:', error);
        return JsonResponse.error(res, 'Error al obtener reservaciones', 500);
    }
};

