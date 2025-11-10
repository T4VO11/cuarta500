const mongoose = require('mongoose');
const { Schema } = mongoose;

const IncidenteSchema = new Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    // URL de la imagen (proveniente de S3 o tu servidor)
    imageUrl: { type: String, required: false }, // Quizás quieras hacerla opcional

    // Quién reporta el incidente
    autorId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Usuario', // Referencia al modelo 'Usuario'
        required: true 
    },
    // A qué condominio pertenece
    condominioId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Condominio', 
        required: true 
    },
    // Estado del incidente
    estado: { 
        type: String, 
        default: 'abierto', 
        enum: ['abierto', 'enProceso', 'resuelto'] 
    }
}, {
    timestamps: false,
    versionKey: false
});

module.exports = mongoose.model('Incidente', IncidenteSchema);