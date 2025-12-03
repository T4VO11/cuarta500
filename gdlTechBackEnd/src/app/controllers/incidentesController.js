const LocalIncidente = require('../../models-local/Incidente');
const AtlasIncidente = require('../../models/atlas/Incidente');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

const createDualWriter = require('../../utils/dualWriter');
const incidenteDW = createDualWriter(LocalIncidente, AtlasIncidente);

// READS con Local (+ Rapido y offline)
exports.index = async (req, res) => {
    try {
        const incidentes = await LocalIncidente.find({ condominio_id: 'C500' })
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

        const incidente = await LocalIncidente.findById(req.params.id);

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

// ---------- STORE (con dualWrite) ----------
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

        // Verificamos que no exista el Id unico
        const incidenteExistente = await LocalIncidente.findOne({ incidente_id });
        if (incidenteExistente) {
            return JsonResponse.error(res, 'El incidente_id ya existe', 400);
        }

        const payload = {
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
        };

        //Usar dualWriter para crear en local e intentar en Atlas (Si falla, encola el registro)
        const nuevoIncidenteLocal = await incidenteDW.create(payload);
        const incidenteObj = nuevoIncidenteLocal.toObject();

        return JsonResponse.success(res, incidenteObj, 'Incidente creado exitosamente', 201);
    } catch (error) {
        console.error('Error en store incidente:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El incidente_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear incidente', 500);
    }
};

// ---------- UPDATE (con dualWrite) ----------
exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const incidente = await LocalIncidente.findById(req.params.id);
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

        const updates = {};
        updates.condominio_id = 'C500';
        if (asunto !== undefined) updates.asunto = asunto;
        if (numeroCasa !== undefined) updates.numeroCasa = numeroCasa;
        if (fecha_reporte !== undefined) updates.fecha_reporte = fecha_reporte;
        if (fecha_ultima_actualizacion) updates.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
        else updates.fecha_ultima_actualizacion = new Date().toISOString();
        if (categoria !== undefined) updates.categoria = categoria;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (estado !== undefined) updates.estado = estado;

        const updated = await incidenteDW.update(req.params.id, updates);

        const incidenteObj = updated.toObject();

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Incidente actualizado exitosamente',
        //         data: incidente
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, incidenteObj, 'Incidente actualizado exitosamente');
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

        const incidente = await LocalIncidente.findById(req.params.id);
        if (!incidente) {
            return JsonResponse.notFound(res, 'Incidente no encontrado');
        }

        // eliminamos con dualWrite 
        await incidenteDW.delete(req.params.id);

        return JsonResponse.success(res, null, 'Incidente eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy incidente:', error);
        return JsonResponse.error(res, 'Error al eliminar incidente', 500);
    }
};
