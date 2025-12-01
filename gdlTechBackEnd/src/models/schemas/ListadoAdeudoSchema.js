const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de ListadoAdeudo según el esquema de la base de datos
 */
const ListadoAdeudoSchema = new Schema({
    transaccion_id: { 
        type: Schema.Types.Mixed, // Puede ser Number o String
        required: true, 
        unique: true 
    },
    condominio_id: { 
        type: String, 
        required: true, 
        default: 'C500' 
    },
    tipo_registro: { 
        type: String, 
        required: true 
    },
    usuario_id: { 
        type: Number, 
        required: true 
    },
    periodo_cubierto: { 
        type: String, 
        required: true 
    },
    monto_base: { 
        type: Number, 
        required: true 
    },
    monto_total_pagado: { 
        type: Number, 
        default: 0 
    },
    fecha_pago: { 
        type: String, 
        default: '' 
    },
    fecha_limite_pago: { 
        type: String, 
        required: true 
    },
    estado: { 
        type: String, 
        enum: ['pendiente', 'pagado', 'vencido', 'cancelado', 'confirmado'], 
        default: 'pendiente' 
    },
    dashboard_id: { 
        type: Number, 
        default: null 
    },
    tipo: { 
        type: String, 
        default: '' 
    },
    periodo: { 
        type: String, 
        default: '' 
    },
    total_unidades: { 
        type: Number, 
        default: 0 
    },
    unidades_pagadas: { 
        type: Number, 
        default: 0 
    },
    unidades_pendientes: { 
        type: Number, 
        default: 0 
    },
    monto_recaudado: { 
        type: Number, 
        default: 0 
    },
    pasarela_pago: {
        nombre: { 
            type: String, 
            default: '' 
        },
        numero_transaccion: { 
            type: String, 
            default: '' 
        },
        datos_adicionales: { 
            type: String, 
            default: '' 
        }
    },
    estado_casas: [{
        casa_numero: { 
            type: String, 
            required: true 
        },
        usuario_id: { 
            type: Number, 
            required: true 
        },
        estado_pago: { 
            type: String, 
            default: '' 
        },
        fecha_transaccion: { 
            type: String, 
            default: '' 
        },
        dias_retraso: { 
            type: Number, 
            default: 0 
        }
    }]
}, {
    timestamps: true,
    versionKey: false
});

module.exports = ListadoAdeudoSchema;

