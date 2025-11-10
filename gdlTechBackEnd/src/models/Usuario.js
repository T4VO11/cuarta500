const mongoose = require('mongoose');
const { Schema } = mongoose;

const UsuarioSchema = new Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // Rol del usuario dentro del condominio
    rol: { 
        type: String, 
        required: true, 
        enum: ['admin', 'guardia', 'dueño', 'habitante', 'arrendatario'] 
    },
    // El ID del condominio al que pertenece. ¡CRÍTICO!
    condominioId: { 
        type: Schema.Types.ObjectId, 
        ref: 'Condominio', // Asumo que tendrás un modelo 'Condominio'
        required: true 
    },
    
    // NUEVO CAMPO: Para vincular habitantes/arrendatarios a un dueño
    dueñoId: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: function() { 
            // Requerido solo si el rol es habitante o arrendatario
            return this.rol === 'habitante' || this.rol === 'arrendatario'; 
        }
    },

    // Otros datos
    telefono: { type: String },
    // Para saber si el usuario ha sido verificado/aprobado por el admin
    activo: { type: Boolean, default: false }
}, {
    timestamps: true, // Crea createdAt y updatedAt
    versionKey: false
});

// Middleware para que 'find' no regrese el password
UsuarioSchema.methods.toJSON = function() {
    const { __v, password, ...usuario } = this.toObject();
    return usuario;
}

module.exports = mongoose.model('Usuario', UsuarioSchema);