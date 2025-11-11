const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarReservacion = [
    check('reservacion_id', 'El reservacion_id es obligatorio y debe ser un número').isInt(),
    check('nombre_residente', 'El nombre_residente es obligatorio').not().isEmpty().trim(),
    check('telefono', 'El telefono es obligatorio').not().isEmpty().trim(),
    check('fecha_evento', 'La fecha_evento es obligatoria').not().isEmpty().trim(),
    check('total', 'El total es obligatorio y debe ser un número').isFloat({ min: 0 }),
    check('estado', 'El estado debe ser válido').optional().isIn(['pendiente', 'confirmada', 'cancelada', 'completada']),
    check('estado_pago', 'El estado_pago debe ser válido').optional().isIn(['pendiente', 'pagado', 'reembolsado']),
    validarResultados
];

