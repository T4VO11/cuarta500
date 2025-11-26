const Incidente = require('../../models/Incidente');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

exports.index = async (req, res) => {
    try {
        const incidentes = await Incidente.find({ condominio_id: 'C500' })
            .sort({ incidente_id: -1 });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Incidentes obtenidos exitosamente',
        //         data: incidentes
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, incidentes, 'Incidentes obtenidos exitosamente');
    } catch (error) {
        console.error('Error en index incidentes:', error);
        return JsonResponse.error(res, 'Error al obtener incidentes', 500);
    }
};

exports.show = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const incidente = await Incidente.findById(req.params.id);

        if (!incidente) {
            return JsonResponse.notFound(res, 'Incidente no encontrado');
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Incidente obtenido exitosamente',
        //         data: incidente
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, incidente, 'Incidente obtenido exitosamente');
    } catch (error) {
        console.error('Error en show incidente:', error);
        return JsonResponse.error(res, 'Error al obtener incidente', 500);
    }
};

exports.store = async (req, res) => {
    try {
        const {
            incidente_id,
            asunto,
            numeroCasa,
            fecha_reporte,
            fecha_ultima_actualizacion,
            categoria,
            descripcion,
            estado,
            usuario_id
        } = req.body;

        const incidenteExistente = await Incidente.findOne({ incidente_id });
        if (incidenteExistente) {
            return JsonResponse.error(res, 'El incidente_id ya existe', 400);
        }

        const nuevoIncidente = new Incidente({
            incidente_id,
            condominio_id: 'C500',
            asunto,
            numeroCasa,
            fecha_reporte,
            fecha_ultima_actualizacion: fecha_ultima_actualizacion || fecha_reporte,
            categoria,
            descripcion,
            estado: estado || 'abierto',
            usuario_id
        });

        await nuevoIncidente.save();

        return JsonResponse.success(res, nuevoIncidente, 'Incidente creado exitosamente', 201);
    } catch (error) {
        console.error('Error en store incidente:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El incidente_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear incidente', 500);
    }
};

exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const incidente = await Incidente.findById(req.params.id);
        if (!incidente) {
            return JsonResponse.notFound(res, 'Incidente no encontrado');
        }

        const {
            asunto,
            numeroCasa,
            fecha_reporte,
            fecha_ultima_actualizacion,
            categoria,
            descripcion,
            estado
        } = req.body;

        if (asunto) incidente.asunto = asunto;
        if (numeroCasa !== undefined) incidente.numeroCasa = numeroCasa;
        if (fecha_reporte) incidente.fecha_reporte = fecha_reporte;
        if (fecha_ultima_actualizacion) incidente.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
        else incidente.fecha_ultima_actualizacion = new Date().toISOString();
        if (categoria) incidente.categoria = categoria;
        if (descripcion) incidente.descripcion = descripcion;
        if (estado) incidente.estado = estado;

        await incidente.save();

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Incidente actualizado exitosamente',
        //         data: incidente
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, incidente, 'Incidente actualizado exitosamente');
    } catch (error) {
        console.error('Error en update incidente:', error);
        return JsonResponse.error(res, 'Error al actualizar incidente', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const incidente = await Incidente.findById(req.params.id);
        if (!incidente) {
            return JsonResponse.notFound(res, 'Incidente no encontrado');
        }

        await Incidente.findByIdAndDelete(req.params.id);

        return JsonResponse.success(res, null, 'Incidente eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy incidente:', error);
        return JsonResponse.error(res, 'Error al eliminar incidente', 500);
    }
};
