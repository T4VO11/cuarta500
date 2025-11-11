const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de Incidente según el esquema de la base de datos
 */
const IncidenteSchema = new Schema({
    incidente_id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    condominio_id: { 
        type: String, 
        required: true, 
        default: 'C500' 
    },
    asunto: { 
        type: String, 
        required: true 
    },
    numeroCasa: { 
        type: Number, 
        required: true 
    },
    fecha_reporte: { 
        type: String, 
        required: true 
    },
    fecha_ultima_actualizacion: { 
        type: String, 
        default: '' 
    },
    categoria: { 
        type: String, 
        required: true 
    },
    descripcion: { 
        type: String, 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['abierto', 'en_proceso', 'resuelto', 'cerrado', 'reportado'], 
        default: 'reportado' 
    },
    usuario_id: { 
        type: Number, 
        required: true 
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Incidente', IncidenteSchema, 'incidentes');
