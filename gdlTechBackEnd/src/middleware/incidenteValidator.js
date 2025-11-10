const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarCrearIncidente = [
    check('titulo', 'El título es obligatorio').not().isEmpty(),
    check('descripcion', 'La descripción es obligatoria').not().isEmpty(),
    validarResultados
];