const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de Categoria
 */
const CategoriaSchema = new Schema({
    categoria_id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    condominio_id: { 
        type: String, 
        required: true, 
        default: 'C500' 
    },
    nombre: { 
        type: String, 
        required: true 
    },
    descripcion: { 
        type: String, 
        default: '' 
    },
    estado: { 
        type: String, 
        enum: ['activo', 'inactivo'], 
        default: 'activo' 
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Categoria', CategoriaSchema, 'categorias');

