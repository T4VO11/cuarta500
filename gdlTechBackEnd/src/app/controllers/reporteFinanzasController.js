const LocalReporteFinanza = require('../../models/local/ReporteFinanza');
const AtlasReporteFinanza = require('../../models/atlas/ReporteFinanza');


const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');

const createDualWriter = require('../../utils/dualWriter');
const reporteFinanzasDW = createDualWriter(LocalReporteFinanza, AtlasReporteFinanza);

// ------------READS (index, show, disponibles usaran local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        const reportes = await LocalReporteFinanza.find({ condominio_id: 'C500' })
            .sort({ reporte_id: -1 });

        const reportesConUrls = reportes.map(reporte => {
            const reporteObj = reporte.toObject();
            if (reporteObj.evidencia?.imagen_url) {
                reporteObj.evidencia.imagen_url = buildImageUrl(req, reporteObj.evidencia.imagen_url);
            }
            return reporteObj;
        });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reportes obtenidos exitosamente',
        //         data: reportesConUrls
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reportesConUrls, 'Reportes obtenidos exitosamente');
    } catch (error) {
        console.error('Error en index reporteFinanzas:', error);
        return JsonResponse.error(res, 'Error al obtener reportes', 500);
    }
};

exports.show = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const reporte = await LocalReporteFinanza.findById(req.params.id);

        if (!reporte) {
            return JsonResponse.notFound(res, 'Reporte no encontrado');
        }

        const reporteObj = reporte.toObject();
        if (reporteObj.evidencia?.imagen_url) {
            reporteObj.evidencia.imagen_url = buildImageUrl(req, reporteObj.evidencia.imagen_url);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reporte obtenido exitosamente',
        //         data: reporteObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reporteObj, 'Reporte obtenido exitosamente');
    } catch (error) {
        console.error('Error en show reporteFinanza:', error);
        return JsonResponse.error(res, 'Error al obtener reporte', 500);
    }
};

exports.store = async (req, res) => {
    try {
        const {
            reporte_id,
            concepto,
            fecha,
            monto,
            categoria,
            descripcion,
            usuario_id,
            evidencia
        } = req.body;

        const reporteExistente = await LocalReporteFinanza.findOne({ reporte_id });
        if (reporteExistente) {
            return JsonResponse.error(res, 'El reporte_id ya existe', 400);
        }

        let evidenciaData = evidencia ? (typeof evidencia === 'string' ? JSON.parse(evidencia) : evidencia) : {};
        if (req.file) {
            evidenciaData.imagen_url = `uploads/reporteFinanzas/${req.file.filename}`;
        }

        // Construimos payload para dualWriter
        const payload  ={
            reporte_id,
            condominio_id: 'C500',
            concepto,
            fecha,
            monto: Number(monto),
            categoria,
            descripcion: descripcion ?? null,
            usuario_id,
            evidencia: evidenciaData
        };

        // Creamos en dualWrite Local -> Atlas
        const nuevoReporteLocal = await reporteFinanzasDW.create(payload);

        const reporteObj = nuevoReporteLocal.toObject();
        if (reporteObj.evidencia?.imagen_url) {
            reporteObj.evidencia.imagen_url = buildImageUrl(req, reporteObj.evidencia.imagen_url);
        }

        return JsonResponse.success(res, reporteObj, 'Reporte creado exitosamente', 201);
    } catch (error) {
        console.error('Error en store reporteFinanza:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El reporte_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear reporte', 500);
    }
};

exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const reporte = await LocalReporteFinanza.findById(req.params.id);
        if (!reporte) {
            return JsonResponse.notFound(res, 'Reporte no encontrado');
        }

        const {
            concepto,
            fecha,
            monto,
            categoria,
            descripcion,
            evidencia
        } = req.body;

        if (req.file) {
            if (!reporte.evidencia) reporte.evidencia = {};
            reporte.evidencia.imagen_url = `uploads/reporteFinanzas/${req.file.filename}`;
        }

        // Creamos objeto updates para dualWrite
        const updates = {};
        updates.condominio_id = 'C500';
        if (concepto !== undefined) updates.concepto = concepto;
        if (fecha !== undefined) updates.fecha = fecha;
        if (monto !== undefined) updates.monto = monto;
        if (categoria !== undefined) updates.categoria = categoria;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (evidencia !== undefined) {
            try {
                const evidenciaData = typeof evidencia === 'string' ? JSON.parse(evidencia) : evidencia;
                updates.evidencia = { ...reporte.evidencia, ...evidenciaData };
            } catch {
                updates.evidencia = { ...reporte.evidencia, ...evidencia };
            }
        }

        // Actualizamos con dualWrite Local -> Atlas
        const updated = await reporteFinanzasDW.update(req.params.id, updates);

        const reporteObj = updated.toObject();
        if (reporteObj.evidencia?.imagen_url) {
            reporteObj.evidencia.imagen_url = buildImageUrl(req, reporteObj.evidencia.imagen_url);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reporte actualizado exitosamente',
        //         data: reporteObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reporteObj, 'Reporte actualizado exitosamente');
    } catch (error) {
        console.error('Error en update reporteFinanza:', error);
        return JsonResponse.error(res, 'Error al actualizar reporte', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const reporte = await LocalReporteFinanza.findById(req.params.id);
        if (!reporte) {
            return JsonResponse.notFound(res, 'Reporte no encontrado');
        }

        await reporteFinanzasDW.delete(req.params.id);

        return JsonResponse.success(res, null, 'Reporte eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy reporteFinanza:', error);
        return JsonResponse.error(res, 'Error al eliminar reporte', 500);
    }
};

