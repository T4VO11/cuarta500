const LocalReglamento = require('../../models/local/Reglamento');
const AtlasReglamento = require('../../models/atlas/Reglamento');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');

const createDualWrite = require('../../utils/dualWriter');
const reglamentoDW = createDualWrite(LocalReglamento, AtlasReglamento);

// ------------READS (index, show, disponibles usaran local. Más rápido y offline).
exports.index = async (req, res) => {
    try {
        const reglamentos = await LocalReglamento.find({ condominio_id: 'C500' })
            .sort({ reglamento: 1 });

        const reglamentosConUrls = reglamentos.map(reglamento => {
            const reglamentoObj = reglamento.toObject();
            if (reglamentoObj.catalogo_detalle?.pdf_url) {
                reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
            }
            return reglamentoObj;
        });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reglamentos obtenidos exitosamente',
        //         data: reglamentosConUrls
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reglamentosConUrls, 'Reglamentos obtenidos exitosamente');
    } catch (error) {
        console.error('Error en index reglamentos:', error);
        return JsonResponse.error(res, 'Error al obtener reglamentos', 500);
    }
};

exports.show = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const reglamento = await LocalReglamento.findById(req.params.id);

        if (!reglamento) {
            return JsonResponse.notFound(res, 'Reglamento no encontrado');
        }

        const reglamentoObj = reglamento.toObject();
        if (reglamentoObj.catalogo_detalle?.pdf_url) {
            reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reglamento obtenido exitosamente',
        //         data: reglamentoObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reglamentoObj, 'Reglamento obtenido exitosamente');
    } catch (error) {
        console.error('Error en show reglamento:', error);
        return JsonResponse.error(res, 'Error al obtener reglamento', 500);
    }
};

exports.store = async (req, res) => {
    try {
        const {
            reglamento,
            nombre,
            descripcion,
            estado,
            catalogo_detalle
        } = req.body;

        const reglamentoExistente = await LocalReglamento.findOne({ reglamento });
        if (reglamentoExistente) {
            return JsonResponse.error(res, 'El reglamento ya existe', 400);
        }

        let catalogoDetalleData = catalogo_detalle ? (typeof catalogo_detalle === 'string' ? JSON.parse(catalogo_detalle) : catalogo_detalle) : {};
        if (req.file) {
            catalogoDetalleData.pdf_url = `reglamentos/${req.file.filename}`;
        }

        // Construimos objeto plano payload para dualWrite
        const payload ={
            reglamento,
            condominio_id: 'C500',
            nombre,
            descripcion: descripcion ?? null,
            estado: estado || 'activo',
            catalogo_detalle: catalogoDetalleData
        };

        // dualWrite para crear en Local e intentar en Atlas (si falla, lo encola)
        const nuevoReglamentoLocal = await reglamentoDW.create(payload);

        const reglamentoObj = nuevoReglamentoLocal.toObject();
        if (reglamentoObj.catalogo_detalle?.pdf_url) {
            reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
        }

        return JsonResponse.success(res, reglamentoObj, 'Reglamento creado exitosamente', 201);
    } catch (error) {
        console.error('Error en store reglamento:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El reglamento ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear reglamento', 500);
    }
};

exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const reglamento = await LocalReglamento.findById(req.params.id);
        if (!reglamento) {
            return JsonResponse.notFound(res, 'Reglamento no encontrado');
        }

        const {
            nombre,
            descripcion,
            estado,
            catalogo_detalle
        } = req.body;

        // Objeto plano updates para dualWrite
        const updates = {};
        updates.condominio_id = 'C500';
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (estado !== undefined) updates.estado = estado;

        // BUILD merge seguro para catalogo_detalle
        const original = reglamento.catalogo_detalle?.toObject?.() ?? reglamento.catalogo_detalle ?? {};
        let mergeData = {};

        if (catalogo_detalle !== undefined) {
            try {
                mergeData = typeof catalogo_detalle === 'string' ? JSON.parse(catalogo_detalle) : catalogo_detalle;
            } catch {
                mergeData = catalogo_detalle;
            }
        }

         let finalCatalogo = { ...original, ...mergeData };
        
         if (req.file) {
            finalCatalogo.pdf_url = `reglamentos/${req.file.filename}`;
        }

        if (catalogo_detalle !== undefined || req.file) {
            updates.catalogo_detalle = finalCatalogo;
        }

        // dualWrite Local -> Atlas
        const updated = await reglamentoDW.update(req.params.id, updates);

        const reglamentoObj = updated.toObject();
        if (reglamentoObj.catalogo_detalle?.pdf_url) {
            reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Reglamento actualizado exitosamente',
        //         data: reglamentoObj
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, reglamentoObj, 'Reglamento actualizado exitosamente');
    } catch (error) {
        console.error('Error en update reglamento:', error);
        return JsonResponse.error(res, 'Error al actualizar reglamento', 500);
    }
};

exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const reglamento = await LocalReglamento.findById(req.params.id);
        if (!reglamento) {
            return JsonResponse.notFound(res, 'Reglamento no encontrado');
        }

        // dualWrite
        await reglamentoDW.delete(req.params.id);

        return JsonResponse.success(res, null, 'Reglamento eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy reglamento:', error);
        return JsonResponse.error(res, 'Error al eliminar reglamento', 500);
    }
};

