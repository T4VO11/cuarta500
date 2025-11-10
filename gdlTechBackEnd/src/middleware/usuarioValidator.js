const { check, body } = require('express-validator');
const mongoose = require('mongoose'); // Necesario para validar el 'dueñoId'
const { validarResultados } = require('./resultadosValidator'); // RUTA CORREGIDA

exports.validarCrearUsuario = [
    check('nombre', 'El nombre es obligatorio').not().isEmpty(),
    check('email', 'El email no es válido o está vacío').isEmail(),
    check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('rol', 'El rol es obligatorio').isIn(['admin', 'guardia', 'dueño', 'habitante', 'arrendatario']),
    check('condominioId', 'El ID del condominio es obligatorio').isMongoId(),

    // NUEVA VALIDACIÓN: Condicional para dueñoId
    body('dueñoId').custom((value, { req }) => {
        const { rol } = req.body;
        if ( (rol === 'habitante' || rol === 'arrendatario') && !value ) {
            // Si el rol es habitante/arrendatario, pero el creador NO es un 'dueño'
            // (ej. un admin crea un habitante), el dueñoId debe venir en el body.
            // Si el creador SÍ es un 'dueño', el controlador forzará el ID.
            if (!req.usuario || req.usuario.rol !== 'dueño') {
                 throw new Error('El dueñoId es obligatorio para habitantes o arrendatarios');
            }
        }
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
             throw new Error('El dueñoId debe ser un ID de Mongo válido');
        }
        return true;
    }),

    validarResultados // Nuestro middleware que revisa los errores
];

exports.validarLogin = [
    check('email', 'El email es obligatorio').isEmail(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarResultados
];