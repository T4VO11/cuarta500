const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarBitacora = [
    check('registro_id', 'El registro_id es obligatorio y debe ser un número').isInt(),
    check('tipo_registro', 'El tipo_registro es obligatorio').not().isEmpty().trim(),
    check('fecha_hora', 'La fecha_hora es obligatoria').not().isEmpty().trim(),
    check('accion', 'La accion es obligatoria').not().isEmpty().trim(),
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    validarResultados
];

