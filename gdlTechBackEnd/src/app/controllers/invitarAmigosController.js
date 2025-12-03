const LocalInvitarAmigo = require('../../models/local/InvitarAmigo');
const AtlasInvitarAmigo = require('../../models/atlas/InvitarAmigo');

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
            areas_permitidas: areas_permitidas ? (typeof areas_permitidas === "string" ? JSON.parse(areas_permitidas) : areas_permitidas) : {},
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

