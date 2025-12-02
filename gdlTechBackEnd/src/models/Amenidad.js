const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de Amenidad según el esquema de la base de datos
 */
const AmenidadSchema = new Schema({
    amenidad_id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    condominio_id: { 
        type: String, 
        required: true, 
        default: 'C500' 
    },
    tipo: { 
        type: String, 
        required: true 
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
        enum: ['activo', 'inactivo', 'disponible', 'activa'], 
        default: 'activo' 
    },
    motivo: { 
        type: String, 
        default: '' 
    },
    espacio_ref_id: { 
        type: Number, 
        default: null 
    },
    usuario_id: { 
        type: Number, 
        default: null 
    },
    catalogo_detalle: {
        precio: { 
            type: Number, 
            default: 0 
        },
        categoria: { 
            type: String, 
            default: '' 
        }
    },
    reglas_apartado: {
        costo_apartado: { 
            type: Number, 
            default: 0 
        },
        extras_disponibles: [{
            nombre: { type: String, required: true },
            costo: { type: Number, required: true },
            descripcion: String // Opcional
        }],
        horario_maximo_horas: { 
            type: Number, 
            default: 0 
        },
        dias_permitidos: [{ 
            type: String 
        }],
        horario_inicio: { 
            type: String, 
            default: '' 
        },
        horario_fin: { 
            type: String, 
            default: '' 
        },
        galeria_urls: [{ 
            type: String 
        }]
    },
    transaccion_detalle: {
        fecha_evento: { 
            type: String, 
            default: '' 
        },
        hora_inicio: { 
            type: String, 
            default: '' 
        },
        hora_fin: { 
            type: String, 
            default: '' 
        },
        monto: { 
            type: Number, 
            default: 0 
        },
        plataforma_pago: { 
            type: String, 
            default: '' 
        },
        estadopago: { 
            type: String, 
            default: '' 
        },
        transaccion_id: { 
            type: String, 
            default: '' 
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Amenidad', AmenidadSchema, 'amenidades');

