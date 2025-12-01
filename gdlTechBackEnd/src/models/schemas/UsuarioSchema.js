const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');

/**
 * Modelo de Usuario según el esquema de la base de datos
 * Basado en los documentos de ejemplo proporcionados
 */
const UsuarioSchema = new Schema({
    usuario_id: { 
        type: Number, 
        required: true, 
        unique: true 
    },
    condominio_id: { 
        type: String, 
        required: true, 
        default: 'C500' 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    rol: { 
        type: String, 
        required: true, 
        enum: ['administrador', 'guardia', 'dueño', 'habitante', 'arrendatario'] 
    },
    nombre: { 
        type: String, 
        required: true 
    },
    apellido_paterno: { 
        type: String, 
        required: true 
    },
    apellido_materno: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    telefono: { 
        type: String, 
        required: true 
    },
    numero_casa: { 
        type: String, 
        default: '' 
    },
    documentos: {
        imagen_perfil_url: { 
            type: String, 
            default: '' 
        },
        imagen_ine_url: { 
            type: String, 
            default: '' 
        }
    },
    perfil_detalle: {
        rfc: { 
            type: String, 
            default: '' 
        },
        nss: { 
            type: String, 
            default: '' 
        },
        numero_casa: { 
            type: String, 
            default: '' 
        },
        auto: {
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
    }
}, {
    timestamps: true, // Crea createdAt y updatedAt
    versionKey: false
});

// Middleware pre-save para hashear password antes de guardar
UsuarioSchema.pre('save', async function(next) {
    // Solo hashear si el password fue modificado
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Método para comparar passwords
UsuarioSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Middleware para que 'toJSON' no regrese el password
UsuarioSchema.methods.toJSON = function() {
    const { password, __v, ...usuario } = this.toObject();
    return usuario;
};

module.exports = UsuarioSchema;
