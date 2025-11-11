const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarIncidente = [
    check('incidente_id', 'El incidente_id es obligatorio y debe ser un número').isInt(),
    check('asunto', 'El asunto es obligatorio').not().isEmpty().trim(),
    check('numeroCasa', 'El numeroCasa es obligatorio y debe ser un número').isInt(),
    check('fecha_reporte', 'La fecha_reporte es obligatoria').not().isEmpty().trim(),
    check('categoria', 'La categoria es obligatoria').not().isEmpty().trim(),
    check('descripcion', 'La descripcion es obligatoria').not().isEmpty().trim(),
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    check('estado', 'El estado debe ser válido').optional().isIn(['abierto', 'en_proceso', 'resuelto', 'cerrado', 'reportado']),
    validarResultados
];
