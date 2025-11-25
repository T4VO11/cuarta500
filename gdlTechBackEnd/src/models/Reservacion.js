const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de Reservacion según el esquema de la base de datos
 */
const ReservacionSchema = new Schema({
    reservacion_id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    nombre_residente: { 
        type: String, 
        required: true 
    },
    telefono: { 
        type: String, 
        required: true 
    },
    fecha_evento: { 
        type: String, 
        required: true 
    },
    servicios_extra: [{
        nombre: { 
            type: String, 
            required: true 
        },
        costo: { 
            type: Number, 
            required: true 
        }
    }],
    total: { 
        type: Number, 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['pendiente', 'confirmada', 'cancelada', 'completada'], 
        default: 'pendiente' 
    },
    estado_pago: { 
        type: String, 
        enum: ['pendiente', 'pagado', 'reembolsado'], 
        default: 'pendiente' 
    },
    usuario_id: { 
        type: Number, 
        required: false 
    },
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Reservacion', ReservacionSchema, 'reservaciones');

