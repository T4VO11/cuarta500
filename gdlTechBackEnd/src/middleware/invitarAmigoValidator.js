const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarInvitarAmigo = [
    check('invitacion_id', 'El invitacion_id es obligatorio y debe ser un número').isInt(),
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    check('numeroCasa', 'El numeroCasa es obligatorio y debe ser un número').isInt(),
    check('nombre_invitado', 'El nombre_invitado es obligatorio').not().isEmpty().trim(),
    check('codigo_acceso', 'El codigo_acceso es obligatorio').not().isEmpty().trim(),
    check('fecha_visita', 'La fecha_visita es obligatoria').not().isEmpty().trim(),
    check('estado', 'El estado debe ser válido').optional().isIn(['pendiente', 'confirmado', 'cancelado', 'completado']),
    validarResultados
];

