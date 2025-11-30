const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Modelo de InvitarAmigo según el esquema de la base de datos
 */
const InvitarAmigoSchema = new Schema({
    invitacion_id: {
        type: Number, 
        required: true, 
        unique: true 
    },
    condominio_id: { 
        type: String, 
        required: true, 
        default: 'C500' 
    },
    usuario_id: { 
        type: Number, 
        required: true 
    },
    numeroCasa: { 
        type: Number, 
        required: true 
    },
    nombre_invitado: { 
        type: String, 
        required: true 
    },
    codigo_acceso: { 
        type: String, 
        required: true 
    },
    fecha_visita: { 
        type: String, 
        required: true 
    },
    correo_electronico: {
        type: String,
        default: ''
    },
    proposito_visita: {
        type: String,
        enum: ['Visita Personal', 'Entrega de Paquete', 'Servicio Técnico', 'Mantenimiento', 'Otro'],
        default: 'Visita Personal'
    },
    hora_inicio: {
        type: String,
        default: ''
    },
    hora_fin: {
        type: String,
        default: ''
    },
    tipo_qr: {
        type: String,
        enum: ['uso_unico', 'usos_multiples'],
        default: 'uso_unico'
    },
    fecha_inicio: {
        type: String,
        default: ''
    },
    fecha_fin: {
        type: String,
        default: ''
    },
    numero_usos: {
        type: Number,
        default: 0
    },
    areas_permitidas: [{
        type: String
    }],
    notas_adicionales: {
        type: String,
        default: ''
    },
    estado: { 
        type: String, 
        enum: ['pendiente', 'confirmado', 'cancelado', 'completado'], 
        default: 'pendiente' 
    },
    vehiculo: {
        modelo: { 
            type: String, 
            default: '' 
        },
        color: { 
            type: String, 
            default: '' 
        },
        placas: { 
            type: String, 
            default: '' 
        }
    }
}, {
    timestamps: true,
    versionKey: false
});

// module.exports = mongoose.model('InvitarAmigo', InvitarAmigoSchema, 'invitarAmigos');

