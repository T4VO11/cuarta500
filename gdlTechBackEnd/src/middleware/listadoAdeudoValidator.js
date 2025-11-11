const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarListadoAdeudo = [
    check('transaccion_id', 'El transaccion_id es obligatorio').not().isEmpty(),
    check('tipo_registro', 'El tipo_registro es obligatorio').not().isEmpty().trim(),
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    check('periodo_cubierto', 'El periodo_cubierto es obligatorio').not().isEmpty().trim(),
    check('monto_base', 'El monto_base es obligatorio y debe ser un número').isFloat({ min: 0 }),
    check('fecha_limite_pago', 'La fecha_limite_pago es obligatoria').not().isEmpty().trim(),
    check('estado', 'El estado debe ser válido').optional().isIn(['pendiente', 'pagado', 'vencido', 'cancelado', 'confirmado']),
    validarResultados
];

