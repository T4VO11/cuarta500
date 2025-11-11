const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarAmenidad = [
    check('amenidad_id', 'El amenidad_id es obligatorio y debe ser un número').isInt(),
    check('tipo', 'El tipo es obligatorio').not().isEmpty().trim(),
    check('nombre', 'El nombre es obligatorio').not().isEmpty().trim(),
    check('estado', 'El estado debe ser válido').optional().isIn(['activo', 'inactivo', 'disponible', 'activa']),
    validarResultados
];
