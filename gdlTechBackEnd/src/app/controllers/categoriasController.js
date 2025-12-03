const LocalCategoria = require('../../models/local/Categoria');
const AtlasCategoria = require('../../models/atlas/Categoria');

const JsonResponse = require('../../utils/JsonResponse');
const Encryption = require('../../utils/encryption');
const mongoose = require('mongoose');

const createDualWriter = require('../../utils/dualWriter');
const categoriaDW = createDualWriter(LocalCategoria, AtlasCategoria);

/**
 * Obtener todas las categorías (index)
 */
exports.index = async (req, res) => {
    try {
        const categorias = await LocalCategoria.find({ condominio_id: 'C500' })
            .sort({ categoria_id: 1 });

        return JsonResponse.success(res, categorias, 'Categorías obtenidas exitosamente');
    } catch (error) {
        console.error('Error en index categorias:', error);
        return JsonResponse.error(res, 'Error al obtener categorías', 500);
    }
};

/**
 * Obtener una categoría por ID (show)
 */
exports.show = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const categoria = await LocalCategoria.findById(id);

        if (!categoria) {
            return JsonResponse.notFound(res, 'Categoría no encontrada');
        }

        return JsonResponse.success(res, categoria, 'Categoría obtenida exitosamente');
    } catch (error) {
        console.error('Error en show categoria:', error);
        return JsonResponse.error(res, 'Error al obtener categoría', 500);
    }
};

/**
 * Crear una nueva categoría (store)
 */
exports.store = async (req, res) => {
    try {
        const {
            categoria_id,
            nombre,
            descripcion,
            estado
        } = req.body;

        // Validación de ID único
        const categoriaExistente = await LocalCategoria.findOne({ categoria_id });
        if (categoriaExistente) {
            return JsonResponse.error(res, 'El categoria_id ya existe', 400);
        }

        const payload = {
            categoria_id,
            condominio_id: 'C500',
            nombre,
            descripcion: descripcion || '',
            estado: estado || 'activo'
        };

        const nuevaCategoriaLocal = await categoriaDW.create(payload);
        const categoriaObj = nuevaCategoriaLocal.toObject();

        return JsonResponse.success(res, categoriaObj, 'Categoría creada exitosamente', 201);
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
 */
exports.update = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const categoria = await LocalCategoria.findById(id);
        if (!categoria) {
            return JsonResponse.notFound(res, 'Categoría no encontrada');
        }

        const {
            nombre,
            descripcion,
            estado
        } = req.body;

        const updates = {};
        updates.condominio_id = 'C500';
        if (nombre !== undefined) updates.nombre = nombre;
        if (descripcion !== undefined) updates.descripcion = descripcion;
        if (estado !== undefined) updates.estado = estado;

        // ❗ CORREGIDO → ahora usa categoriaDW
        const updated = await categoriaDW.update(id, updates);

        const categoriaObj = updated.toObject();

        return JsonResponse.success(res, categoriaObj, 'Categoría actualizada exitosamente');
    } catch (error) {
        console.error('Error en update categoria:', error);
        return JsonResponse.error(res, 'Error al actualizar categoría', 500);
    }
};

/**
 * Eliminar una categoría (destroy)
 */
exports.destroy = async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return JsonResponse.error(res, 'ID inválido', 400);
        }

        const categoria = await LocalCategoria.findById(id);
        if (!categoria) {
            return JsonResponse.notFound(res, 'Categoría no encontrada');
        }

        await categoriaDW.delete(id);

        return JsonResponse.success(res, null, 'Categoría eliminada exitosamente');
    } catch (error) {
        console.error('Error en destroy categoria:', error);
        return JsonResponse.error(res, 'Error al eliminar categoría', 500);
    }
};
