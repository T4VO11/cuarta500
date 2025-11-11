const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarCrearUsuario = [
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    check('username', 'El username es obligatorio').not().isEmpty().trim(),
    check('password', 'El password debe tener al menos 6 caracteres').isLength({ min: 6 }),
    check('rol', 'El rol es obligatorio').isIn(['administrador', 'guardia', 'dueño', 'habitante', 'arrendatario']),
    check('nombre', 'El nombre es obligatorio').not().isEmpty().trim(),
    check('apellido_paterno', 'El apellido paterno es obligatorio').not().isEmpty().trim(),
    check('apellido_materno', 'El apellido materno es obligatorio').not().isEmpty().trim(),
    check('email', 'El email debe ser válido').isEmail().normalizeEmail(),
    check('telefono', 'El teléfono es obligatorio').not().isEmpty().trim(),
    validarResultados
];

exports.validarLogin = [
    check('username', 'El username es obligatorio').not().isEmpty().trim(),
    check('password', 'El password es obligatorio').not().isEmpty(),
    validarResultados
];

exports.validarActualizarUsuario = [
    check('username', 'El username debe ser válido').optional().not().isEmpty().trim(),
    check('password', 'El password debe tener al menos 6 caracteres').optional().isLength({ min: 6 }),
    check('nombre', 'El nombre debe ser válido').optional().not().isEmpty().trim(),
    check('apellido_paterno', 'El apellido paterno debe ser válido').optional().not().isEmpty().trim(),
    check('apellido_materno', 'El apellido materno debe ser válido').optional().not().isEmpty().trim(),
    check('email', 'El email debe ser válido').optional().isEmail().normalizeEmail(),
    check('telefono', 'El teléfono debe ser válido').optional().not().isEmpty().trim(),
    validarResultados
];
