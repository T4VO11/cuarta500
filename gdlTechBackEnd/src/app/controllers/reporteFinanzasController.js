const ReporteFinanza = require('../../models/ReporteFinanza');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');

exports.index = async (req, res) => {
    try {
        const reportes = await ReporteFinanza.find({ condominio_id: 'C500' })
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

        const reporte = await ReporteFinanza.findById(req.params.id);

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

        const reporteExistente = await ReporteFinanza.findOne({ reporte_id });
        if (reporteExistente) {
            return JsonResponse.error(res, 'El reporte_id ya existe', 400);
        }

        let evidenciaData = evidencia ? (typeof evidencia === 'string' ? JSON.parse(evidencia) : evidencia) : {};
        if (req.file) {
            evidenciaData.imagen_url = `reporteFinanzas/${req.file.filename}`;
        }

        const nuevoReporte = new ReporteFinanza({
            reporte_id,
            condominio_id: 'C500',
            concepto,
            fecha,
            monto,
            categoria,
            descripcion: descripcion || '',
            usuario_id,
            evidencia: evidenciaData
        });

        await nuevoReporte.save();

        const reporteObj = nuevoReporte.toObject();
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

        const reporte = await ReporteFinanza.findById(req.params.id);
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
            reporte.evidencia.imagen_url = `reporteFinanzas/${req.file.filename}`;
        }

        if (concepto) reporte.concepto = concepto;
        if (fecha) reporte.fecha = fecha;
        if (monto !== undefined) reporte.monto = monto;
        if (categoria) reporte.categoria = categoria;
        if (descripcion !== undefined) reporte.descripcion = descripcion;
        if (evidencia) {
            try {
                const evidenciaData = typeof evidencia === 'string' ? JSON.parse(evidencia) : evidencia;
                reporte.evidencia = { ...reporte.evidencia, ...evidenciaData };
            } catch {
                reporte.evidencia = { ...reporte.evidencia, ...evidencia };
            }
        }

        await reporte.save();

        const reporteObj = reporte.toObject();
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

        const reporte = await ReporteFinanza.findById(req.params.id);
        if (!reporte) {
            return JsonResponse.notFound(res, 'Reporte no encontrado');
        }

        await ReporteFinanza.findByIdAndDelete(req.params.id);

        return JsonResponse.success(res, null, 'Reporte eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy reporteFinanza:', error);
        return JsonResponse.error(res, 'Error al eliminar reporte', 500);
    }
};

