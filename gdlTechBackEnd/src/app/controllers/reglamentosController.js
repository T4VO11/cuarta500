const Reglamento = require('../../models/Reglamento');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');
const { buildImageUrl } = require('../../utils/imageUrlHelper');

exports.index = async (req, res) => {
    try {
        const reglamentos = await Reglamento.find({ condominio_id: 'C500' })
            .sort({ reglamento: 1 });

        const reglamentosConUrls = reglamentos.map(reglamento => {
            const reglamentoObj = reglamento.toObject();
            if (reglamentoObj.catalogo_detalle?.pdf_url) {
                reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
            }
            return reglamentoObj;
        });

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reglamentos obtenidos exitosamente',
                data: reglamentosConUrls
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

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

        const reglamento = await Reglamento.findById(req.params.id);

        if (!reglamento) {
            return JsonResponse.notFound(res, 'Reglamento no encontrado');
        }

        const reglamentoObj = reglamento.toObject();
        if (reglamentoObj.catalogo_detalle?.pdf_url) {
            reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
        }

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reglamento obtenido exitosamente',
                data: reglamentoObj
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

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

        const reglamentoExistente = await Reglamento.findOne({ reglamento });
        if (reglamentoExistente) {
            return JsonResponse.error(res, 'El reglamento ya existe', 400);
        }

        let catalogoDetalleData = catalogo_detalle ? (typeof catalogo_detalle === 'string' ? JSON.parse(catalogo_detalle) : catalogo_detalle) : {};
        if (req.file) {
            catalogoDetalleData.pdf_url = `reglamentos/${req.file.filename}`;
        }

        const nuevoReglamento = new Reglamento({
            reglamento,
            condominio_id: 'C500',
            nombre,
            descripcion: descripcion || '',
            estado: estado || 'activo',
            catalogo_detalle: catalogoDetalleData
        });

        await nuevoReglamento.save();

        const reglamentoObj = nuevoReglamento.toObject();
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

        const reglamento = await Reglamento.findById(req.params.id);
        if (!reglamento) {
            return JsonResponse.notFound(res, 'Reglamento no encontrado');
        }

        const {
            nombre,
            descripcion,
            estado,
            catalogo_detalle
        } = req.body;

        if (req.file) {
            if (!reglamento.catalogo_detalle) reglamento.catalogo_detalle = {};
            reglamento.catalogo_detalle.pdf_url = `reglamentos/${req.file.filename}`;
        }

        if (nombre) reglamento.nombre = nombre;
        if (descripcion !== undefined) reglamento.descripcion = descripcion;
        if (estado) reglamento.estado = estado;
        if (catalogo_detalle) {
            try {
                const catalogoData = typeof catalogo_detalle === 'string' ? JSON.parse(catalogo_detalle) : catalogo_detalle;
                reglamento.catalogo_detalle = { ...reglamento.catalogo_detalle, ...catalogoData };
            } catch {
                reglamento.catalogo_detalle = { ...reglamento.catalogo_detalle, ...catalogo_detalle };
            }
        }

        await reglamento.save();

        const reglamentoObj = reglamento.toObject();
        if (reglamentoObj.catalogo_detalle?.pdf_url) {
            reglamentoObj.catalogo_detalle.pdf_url = buildImageUrl(req, reglamentoObj.catalogo_detalle.pdf_url);
        }

        if (req.query.encrypt === 'true') {
            const responseData = {
                estado: 'exito',
                mensaje: 'Reglamento actualizado exitosamente',
                data: reglamentoObj
            };
            const encryptedResponse = Encryption.encryptResponse(responseData);
            return res.json(encryptedResponse);
        }

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

        const reglamento = await Reglamento.findById(req.params.id);
        if (!reglamento) {
            return JsonResponse.notFound(res, 'Reglamento no encontrado');
        }

        await Reglamento.findByIdAndDelete(req.params.id);

        return JsonResponse.success(res, null, 'Reglamento eliminado exitosamente');
    } catch (error) {
        console.error('Error en destroy reglamento:', error);
        return JsonResponse.error(res, 'Error al eliminar reglamento', 500);
    }
};

