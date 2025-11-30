const InvitarAmigo = require('../../models/InvitarAmigo');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

exports.index = async (req, res) => {
    try {
        const invitaciones = await InvitarAmigo.find({ condominio_id: 'C500' })
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

        const invitacion = await InvitarAmigo.findById(req.params.id);

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

        const invitacionExistente = await InvitarAmigo.findOne({ invitacion_id });
        if (invitacionExistente) {
            return JsonResponse.error(res, 'El invitacion_id ya existe', 400);
        }

        const nuevaInvitacion = new InvitarAmigo({
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
            areas_permitidas: areas_permitidas || [],
            notas_adicionales: notas_adicionales || '',
            estado: estado || 'pendiente',
            vehiculo: vehiculo ? (typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo) : {}
        });

        await nuevaInvitacion.save();

        return JsonResponse.success(res, nuevaInvitacion, 'Invitación creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store invitarAmigo:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El invitacion_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear invitación', 500);
    }
};

exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const invitacion = await InvitarAmigo.findById(req.params.id);
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

        if (numeroCasa !== undefined) invitacion.numeroCasa = numeroCasa;
        if (nombre_invitado) invitacion.nombre_invitado = nombre_invitado;
        if (codigo_acceso) invitacion.codigo_acceso = codigo_acceso;
        if (fecha_visita) invitacion.fecha_visita = fecha_visita;
        if (correo_electronico !== undefined) invitacion.correo_electronico = correo_electronico;
        if (proposito_visita) invitacion.proposito_visita = proposito_visita;
        if (hora_inicio !== undefined) invitacion.hora_inicio = hora_inicio;
        if (hora_fin !== undefined) invitacion.hora_fin = hora_fin;
        if (tipo_qr) invitacion.tipo_qr = tipo_qr;
        if (fecha_inicio !== undefined) invitacion.fecha_inicio = fecha_inicio;
        if (fecha_fin !== undefined) invitacion.fecha_fin = fecha_fin;
        if (numero_usos !== undefined) invitacion.numero_usos = numero_usos;
        if (areas_permitidas !== undefined) invitacion.areas_permitidas = areas_permitidas;
        if (notas_adicionales !== undefined) invitacion.notas_adicionales = notas_adicionales;
        if (estado) invitacion.estado = estado;
        if (vehiculo) {
            try {
                const vehiculoData = typeof vehiculo === 'string' ? JSON.parse(vehiculo) : vehiculo;
                invitacion.vehiculo = { ...invitacion.vehiculo, ...vehiculoData };
            } catch {
                invitacion.vehiculo = { ...invitacion.vehiculo, ...vehiculo };
            }
        }

        await invitacion.save();

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Invitación actualizada exitosamente',
        //         data: invitacion
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, invitacion, 'Invitación actualizada exitosamente');
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

        const invitacion = await InvitarAmigo.findById(req.params.id);
        if (!invitacion) {
            return JsonResponse.notFound(res, 'Invitación no encontrada');
        }

        await InvitarAmigo.findByIdAndDelete(req.params.id);

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

        const usuarioIdNum = Number(usuario_id);
        
        // Buscar invitaciones del usuario
        const invitaciones = await InvitarAmigo.find({ 
            condominio_id: 'C500',
            usuario_id: usuarioIdNum
        })
        .sort({ createdAt: -1 });

        return JsonResponse.success(res, invitaciones, 'Invitaciones obtenidas exitosamente');
    } catch (error) {
        console.error('Error en misInvitaciones:', error);
        return JsonResponse.error(res, 'Error al obtener invitaciones', 500);
    }
};

