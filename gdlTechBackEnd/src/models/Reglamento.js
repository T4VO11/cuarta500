const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de Reglamento según el esquema de la base de datos
 */
const ReglamentoSchema = new Schema({
    reglamento: { 
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
    },
    catalogo_detalle: {
        pdf_url: { 
            type: String, 
            default: '' 
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Reglamento', ReglamentoSchema, 'reglamento');

