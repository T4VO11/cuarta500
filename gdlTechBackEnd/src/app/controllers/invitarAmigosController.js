const LocalInvitarAmigo = require('../../models/local/InvitarAmigo');
const AtlasInvitarAmigo = require('../../models/atlas/InvitarAmigo');
const Bitacora = require('../../models/Bitacora');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

const createDualWriter = require('../../utils/dualWriter')
const invitarAmigoDW = createDualWriter(LocalInvitarAmigo, AtlasInvitarAmigo);

// ------------READS (index, show, disponibles usaran local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        const invitaciones = await LocalInvitarAmigo.find({ condominio_id: 'C500' })
            .sort({ createdAt: -1 });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Invitaciones obtenidas exitosamente',
        //         data: invitaciones
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, invitaciones, 'Invitaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index invitarAmigos:', error);
        return JsonResponse.error(res, 'Error al obtener invitaciones', 500);
    }
};

exports.show = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const invitacion = await LocalInvitarAmigo.findById(req.params.id);

        if (!invitacion) {
            return JsonResponse.notFound(res, 'Invitación no encontrada');
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Invitación obtenida exitosamente',
        //         data: invitacion
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, invitacion, 'Invitación obtenida exitosamente');
    } catch (error) {
        console.error('Error en show invitarAmigo:', error);
        return JsonResponse.error(res, 'Error al obtener invitación', 500);
    }
};

exports.store = async (req, res) => {
    try {
        const {
            invitacion_id,
            usuario_id,
            numeroCasa,
            nombre_invitado,
            codigo_acceso,
            fecha_visita,
            correo_electronico,
            proposito_visita,
            hora_inicio,
            hora_fin,
            tipo_qr,
            fecha_inicio,
            fecha_fin,
            numero_usos,
            areas_permitidas,
            notas_adicionales,
            estado,
            vehiculo
        } = req.body;

        const invitacionExistente = await LocalInvitarAmigo.findOne({ invitacion_id });
        if (invitacionExistente) {
            return JsonResponse.error(res, 'El invitacion_id ya existe', 400);
        }

        // Manejamos objeto plano 'payload' para usar dualWriter en lugar de la instancia Mongooose
        const payload = {
            invitacion_id,
            condominio_id: 'C500',
            usuario_id,
            numeroCasa,
            nombre_invitado,
            codigo_acceso,
            fecha_visita,
            correo_electronico: correo_electronico || '',
            proposito_visita: proposito_visita || 'Visita Personal',
            hora_inicio: hora_inicio || '',
            hora_fin: hora_fin || '',
            tipo_qr: tipo_qr || 'uso_unico',
            fecha_inicio: fecha_inicio || '',
            fecha_fin: fecha_fin || '',
            numero_usos: numero_usos || 0,
            usos_actuales: 0, // Inicializar contador de usos en 0
            areas_permitidas: areas_permitidas ? (typeof areas_permitidas === "string" ? JSON.parse(areas_permitidas) : areas_permitidas) : [],
            notas_adicionales: notas_adicionales || '',
            estado: estado || 'pendiente',
            vehiculo: vehiculo ? (typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo) : {}
        };

        // Usamos dualWriter para crear en local e intentar en Atlas, (si falla, lo encola)
        const nuevaInvitacionLocal = await invitarAmigoDW.create(payload);

        return JsonResponse.success(res, nuevaInvitacionLocal, 'Invitación creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store invitarAmigo:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El invitacion_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear invitación', 500);
    }
};

// ------------ UPDATE (con dualWriter) ------------ 
exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const invitacion = await LocalInvitarAmigo.findById(req.params.id);
        if (!invitacion) {
            return JsonResponse.notFound(res, 'Invitación no encontrada');
        }

        const {
            numeroCasa,
            nombre_invitado,
            codigo_acceso,
            fecha_visita,
            correo_electronico,
            proposito_visita,
            hora_inicio,
            hora_fin,
            tipo_qr,
            fecha_inicio,
            fecha_fin,
            numero_usos,
            usos_actuales,
            areas_permitidas,
            notas_adicionales,
            estado,
            vehiculo
        } = req.body;

        const updates = {}
        updates.condominio_id = 'C500';
        if (numeroCasa !== undefined) updates.numeroCasa = numeroCasa;
        if (nombre_invitado !== undefined) updates.nombre_invitado = nombre_invitado;
        if (codigo_acceso !== undefined) updates.codigo_acceso = codigo_acceso;
        if (fecha_visita !== undefined) updates.fecha_visita = fecha_visita;
        if (correo_electronico !== undefined) updates.correo_electronico = correo_electronico;
        if (proposito_visita !== undefined) updates.proposito_visita = proposito_visita;
        if (hora_inicio !== undefined) updates.hora_inicio = hora_inicio;
        if (hora_fin !== undefined) updates.hora_fin = hora_fin;
        if (tipo_qr !== undefined) updates.tipo_qr = tipo_qr;
        if (fecha_inicio !== undefined) updates.fecha_inicio = fecha_inicio;
        if (fecha_fin !== undefined) updates.fecha_fin = fecha_fin;
        if (numero_usos !== undefined) updates.numero_usos = numero_usos;
        if (usos_actuales !== undefined) updates.usos_actuales = usos_actuales;
        if (notas_adicionales !== undefined) updates.notas_adicionales = notas_adicionales;
        if (estado !== undefined) updates.estado = estado;

        // Areas permitidas  (objeto a JSON)
        if (areas_permitidas !== undefined) {
            try {
                updates.areas_permitidas = typeof areas_permitidas === "string" ? JSON.parse(areas_permitidas) : areas_permitidas;
            } catch {
                updates.areas_permitidas = areas_permitidas;
            }
        }

        // Vehiculo (merge con datos ya existentes)
        if (vehiculo !== undefined) {
            try {
                const vehiculoData = typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo;
                updates.vehiculo = { ...(invitacion.vehiculo || {}), ...vehiculoData };
            } catch {
                updates.vehiculo = { ...(invitacion.vehiculo || {}), ...vehiculo };
            }
        }

        // actualizamos con dualwrite (Local -> Atlas)
        const updated = await invitarAmigoDW.update(req.params.id, updates);

        const invitacionObj = updated.toObject();
        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Invitación actualizada exitosamente',
        //         data: invitacion
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, invitacionObj, 'Invitación actualizada exitosamente');
    } catch (error) {
        console.error('Error en update invitarAmigo:', error);
        return JsonResponse.error(res, 'Error al actualizar invitación', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const invitacion = await LocalInvitarAmigo.findById(req.params.id);
        if (!invitacion) {
            return JsonResponse.notFound(res, 'Invitación no encontrada');
        }

        // dualWrite para eliminar Local -> Atlas
        await invitarAmigoDW.delete(req.params.id);

        return JsonResponse.success(res, null, 'Invitación eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy invitarAmigo:', error);
        return JsonResponse.error(res, 'Error al eliminar invitación', 500);
    }
};

// Endpoint para usuarios normales: obtener invitaciones del usuario autenticado
exports.misInvitaciones = async (req, res) => {
    try {
        // Obtener usuario_id del token JWT
        const usuario_id = req.usuario?.usuario_id;
        
        if (!usuario_id) {
            return JsonResponse.error(res, 'Usuario no identificado', 401);
        }

        // Buscar invitaciones del usuario
        const invitaciones = await LocalInvitarAmigo.find({ 
            condominio_id: 'C500',
            usuario_id: Number(usuario_id)
        })
        .sort({ createdAt: -1 });

        return JsonResponse.success(res, invitaciones, 'Invitaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en misInvitaciones:', error);
        return JsonResponse.error(res, 'Error al obtener invitaciones', 500);
    }
};

// Endpoint para IoT: validar QR escaneado
exports.validarQr = async (req, res) => {
    try {
        const { qr_data } = req.body;

        // Validar que se recibió el QR
        if (!qr_data) {
            return JsonResponse.error(res, 'QR data es requerido', 400);
        }

        // Parsear QR data si viene como string
        let qrDataParsed;
        if (typeof qr_data === 'string') {
            try {
                qrDataParsed = JSON.parse(qr_data);
            } catch (e) {
                return JsonResponse.error(res, 'QR data inválido', 400);
            }
        } else {
            qrDataParsed = qr_data;
        }

        // Buscar invitación por codigo_acceso o invitacion_id
        const codigoAcceso = qrDataParsed.codigo_acceso;
        const invitacionId = qrDataParsed.invitacion_id;

        if (!codigoAcceso && !invitacionId) {
            return JsonResponse.error(res, 'Código de acceso o ID de invitación requerido', 400);
        }

        // Buscar la invitación
        let invitacion;
        if (invitacionId) {
            invitacion = await LocalInvitarAmigo.findOne({ invitacion_id: invitacionId });
        } else {
            invitacion = await LocalInvitarAmigo.findOne({ codigo_acceso: codigoAcceso });
        }

        if (!invitacion) {
            return JsonResponse.error(res, 'QR no encontrado o inválido', 404);
        }

        // Validar estado
        if (invitacion.estado === 'cancelado') {
            return JsonResponse.error(res, 'QR cancelado', 403);
        }

        // Validar si el QR ya fue completado
        if (invitacion.estado === 'completado') {
            if (invitacion.tipo_qr === 'uso_unico') {
                return JsonResponse.error(res, 'QR de uso único ya utilizado', 403);
            } else if (invitacion.tipo_qr === 'usos_multiples') {
                // Verificar si alcanzó el límite de usos
                if (invitacion.numero_usos > 0 && invitacion.usos_actuales >= invitacion.numero_usos) {
                    return JsonResponse.error(res, 'QR ha alcanzado el límite de usos', 403);
                }
                // Si está completado pero no alcanzó el límite, permitir reactivarlo
                // (puede haber sido marcado manualmente como completado)
            }
        }

        // Validar fechas según tipo de QR
        const ahora = new Date();
        const fechaHora = ahora.toISOString().slice(0, 19).replace('T', ' ');

        if (invitacion.tipo_qr === 'uso_unico') {
            // Validar fecha_visita y hora_inicio/hora_fin
            const fechaVisita = new Date(invitacion.fecha_visita);
            const fechaHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

            if (fechaVisita.getTime() !== fechaHoy.getTime()) {
                return JsonResponse.error(res, 'QR no válido para la fecha actual', 403);
            }

            // Validar hora si está configurada
            if (invitacion.hora_inicio && invitacion.hora_fin) {
                const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
                const [horaInicioH, horaInicioM] = invitacion.hora_inicio.split(':').map(Number);
                const [horaFinH, horaFinM] = invitacion.hora_fin.split(':').map(Number);
                const horaInicio = horaInicioH * 60 + horaInicioM;
                const horaFin = horaFinH * 60 + horaFinM;

                if (horaActual < horaInicio || horaActual > horaFin) {
                    return JsonResponse.error(res, 'QR no válido para la hora actual', 403);
                }
            }
        } else if (invitacion.tipo_qr === 'usos_multiples') {
            // Validar rango de fechas
            if (invitacion.fecha_inicio && invitacion.fecha_fin) {
                const fechaInicio = new Date(invitacion.fecha_inicio);
                const fechaFin = new Date(invitacion.fecha_fin);
                fechaFin.setHours(23, 59, 59, 999); // Incluir todo el día de fin

                if (ahora < fechaInicio || ahora > fechaFin) {
                    return JsonResponse.error(res, 'QR fuera del período de validez', 403);
                }
            }

            // Validar número de usos
            if (invitacion.numero_usos > 0) {
                const usosActuales = invitacion.usos_actuales || 0;
                if (usosActuales >= invitacion.numero_usos) {
                    return JsonResponse.error(res, 'QR ha alcanzado el límite de usos', 403);
                }
            }
        }

        // Si llegamos aquí, el QR es válido
        // Actualizar estado según tipo
        let accesoPermitido = true;
        let mensajeAcceso = 'Acceso permitido';

        const updates = {};
        
        if (invitacion.tipo_qr === 'uso_unico') {
            // Marcar como completado (deshabilitado)
            updates.estado = 'completado';
            mensajeAcceso = 'Acceso permitido - QR de uso único deshabilitado';
        } else if (invitacion.tipo_qr === 'usos_multiples') {
            // Incrementar contador de usos
            const nuevosUsos = (invitacion.usos_actuales || 0) + 1;
            updates.usos_actuales = nuevosUsos;
            
            // Si alcanzó el límite, marcar como completado
            if (invitacion.numero_usos > 0 && nuevosUsos >= invitacion.numero_usos) {
                updates.estado = 'completado';
                mensajeAcceso = `Acceso permitido - Usos restantes: 0 (QR deshabilitado)`;
            } else {
                const usosRestantes = invitacion.numero_usos > 0 
                    ? invitacion.numero_usos - nuevosUsos 
                    : 'ilimitados';
                mensajeAcceso = `Acceso permitido - Usos restantes: ${usosRestantes}`;
            }
        }

        // Actualizar usando dualWriter para sincronizar con Atlas
        if (Object.keys(updates).length > 0) {
            await invitarAmigoDW.update(invitacion._id, updates);
            // Recargar invitación para obtener valores actualizados
            invitacion = await LocalInvitarAmigo.findById(invitacion._id);
        }

        // Registrar en bitácora
        try {
            const registroId = Math.floor(Date.now() / 1000) % 1000000; // ID único basado en timestamp
            
            const nuevaBitacora = new Bitacora({
                registro_id: registroId,
                condominio_id: 'C500',
                tipo_registro: 'acceso_qr',
                fecha_hora: fechaHora,
                accion: 'Acceso con QR',
                usuario_id: invitacion.usuario_id,
                invitacion_id: invitacion.invitacion_id,
                detalle_acceso: {
                    metodo: 'QR Code',
                    numeroCasa: invitacion.numeroCasa,
                    nombre_visitante: invitacion.nombre_invitado,
                    codigo_acceso: invitacion.codigo_acceso,
                    motivo: invitacion.proposito_visita || 'Visita Personal'
                },
                vehiculo: invitacion.vehiculo || {}
            });

            await nuevaBitacora.save();
        } catch (bitacoraError) {
            console.error('Error al registrar en bitácora:', bitacoraError);
            // No fallar la validación si falla la bitácora
        }

        return JsonResponse.success(res, {
            acceso_permitido: accesoPermitido,
            mensaje: mensajeAcceso,
            invitacion: {
                invitacion_id: invitacion.invitacion_id,
                nombre_invitado: invitacion.nombre_invitado,
                tipo_qr: invitacion.tipo_qr,
                estado: invitacion.estado,
                usos_actuales: invitacion.usos_actuales || 0,
                numero_usos: invitacion.numero_usos || 0
            }
        }, mensajeAcceso);

    } catch (error) {
        console.error('Error en validarQr:', error);
        return JsonResponse.error(res, 'Error al validar QR', 500);
    }
};

