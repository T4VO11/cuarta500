const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarReporteFinanza = [
    check('reporte_id', 'El reporte_id es obligatorio y debe ser un número').isInt(),
    check('concepto', 'El concepto es obligatorio').not().isEmpty().trim(),
    check('fecha', 'La fecha es obligatoria').not().isEmpty().trim(),
    check('monto', 'El monto es obligatorio y debe ser un número').isFloat(),
    check('categoria', 'La categoria es obligatoria').not().isEmpty().trim(),
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    validarResultados
];

