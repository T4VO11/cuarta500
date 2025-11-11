const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarCategoria = [
    check('categoria_id', 'El categoria_id es obligatorio y debe ser un número').isInt(),
    check('nombre', 'El nombre es obligatorio').not().isEmpty().trim(),
    check('estado', 'El estado debe ser activo o inactivo').optional().isIn(['activo', 'inactivo']),
    validarResultados
];

