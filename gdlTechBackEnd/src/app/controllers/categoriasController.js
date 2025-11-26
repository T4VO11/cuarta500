const Categoria = require('../../models/Categoria');
const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

/**
 * Obtener todas las categorías (index)
 * GET /categorias
 */
exports.index = async (req, res) => {
    try {
        const categorias = await Categoria.find({ condominio_id: 'C500' })
            .sort({ categoria_id: 1 });

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Categorías obtenidas exitosamente',
        //         data: categorias
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, categorias, 'Categorías obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index categorias:', error);
        return JsonResponse.error(res, 'Error al obtener categorías', 500);
    }
};

/**
 * Obtener una categoría por ID (show)
 * GET /categorias/:id
 */
exports.show = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const categoria = await Categoria.findById(req.params.id);

        if (!categoria) {
            return JsonResponse.notFound(res, 'Categoría no encontrada');
        }

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Categoría obtenida exitosamente',
        //         data: categoria
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, categoria, 'Categoría obtenida exitosamente');
    } catch (error) {
        console.error('Error en show categoria:', error);
        return JsonResponse.error(res, 'Error al obtener categoría', 500);
    }
};

/**
 * Crear una nueva categoría (store)
 * POST /categorias
 */
exports.store = async (req, res) => {
    try {
        const {
            categoria_id,
            nombre,
            descripcion,
            estado
        } = req.body;

        // Verificar si el categoria_id ya existe
        const categoriaExistente = await Categoria.findOne({ categoria_id });
        if (categoriaExistente) {
            return JsonResponse.error(res, 'El categoria_id ya existe', 400);
        }

        const nuevaCategoria = new Categoria({
            categoria_id,
            condominio_id: 'C500',
            nombre,
            descripcion: descripcion || '',
            estado: estado || 'activo'
        });

        await nuevaCategoria.save();

        return JsonResponse.success(res, nuevaCategoria, 'Categoría creada exitosamente', 201);
    } catch (error) {
        console.error('Error en store categoria:', error);
        if (error.code === 11000) {
            return JsonResponse.error(res, 'El categoria_id ya existe', 400);
        }
        return JsonResponse.error(res, 'Error al crear categoría', 500);
    }
};

/**
 * Actualizar una categoría (update)
 * PUT /categorias/:id
 */
exports.update = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return JsonResponse.notFound(res, 'Categoría no encontrada');
        }

        const {
            nombre,
            descripcion,
            estado
        } = req.body;

        if (nombre) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion = descripcion;
        if (estado) categoria.estado = estado;

        await categoria.save();

        // if (req.query.encrypt === 'true') {
        //     const responseData = {
        //         estado: 'exito',
        //         mensaje: 'Categoría actualizada exitosamente',
        //         data: categoria
        //     };
        //     const encryptedResponse = Encryption.encryptResponse(responseData);
        //     return res.json(encryptedResponse);
        // }

        return JsonResponse.success(res, categoria, 'Categoría actualizada exitosamente');
    } catch (error) {
        console.error('Error en update categoria:', error);
        return JsonResponse.error(res, 'Error al actualizar categoría', 500);
    }
};

/**
 * Eliminar una categoría (destroy)
 * DELETE /categorias/:id
 */
exports.destroy = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return JsonResponse.notFound(res, 'Categoría no encontrada');
        }

        await Categoria.findByIdAndDelete(req.params.id);

        return JsonResponse.success(res, null, 'Categoría eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy categoria:', error);
        return JsonResponse.error(res, 'Error al eliminar categoría', 500);
    }
};

