const { check } = require('express-validator');
const { validarResultados } = require('./resultadosValidator');

exports.validarInvitarAmigo = [
    check('invitacion_id', 'El invitacion_id es obligatorio y debe ser un número').isInt(),
    check('usuario_id', 'El usuario_id es obligatorio y debe ser un número').isInt(),
    check('numeroCasa', 'El numeroCasa es obligatorio y debe ser un número').isInt(),
    check('nombre_invitado', 'El nombre_invitado es obligatorio').not().isEmpty().trim(),
    check('codigo_acceso', 'El codigo_acceso es obligatorio').not().isEmpty().trim(),
    check('fecha_visita', 'La fecha_visita es obligatoria').not().isEmpty().trim(),
    check('correo_electronico', 'El correo electrónico debe ser válido').optional().custom((value) => {
        if (!value || value.trim() === '') {
            return true; // Permitir valores vacíos ya que es opcional
        }
        // Si tiene valor, validar que sea un email válido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            throw new Error('El correo electrónico debe ser válido');
        }
        return true;
    }),
    check('proposito_visita', 'El propósito de visita debe ser válido').optional().isIn(['Visita Personal', 'Entrega de Paquete', 'Servicio Técnico', 'Mantenimiento', 'Otro']),
    check('hora_inicio', 'La hora de inicio debe tener formato HH:MM').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    check('hora_fin', 'La hora de fin debe tener formato HH:MM').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    check('tipo_qr', 'El tipo de QR debe ser válido').optional().isIn(['uso_unico', 'usos_multiples']),
    check('fecha_inicio', 'La fecha de inicio debe tener formato YYYY-MM-DD').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    check('fecha_fin', 'La fecha de fin debe tener formato YYYY-MM-DD').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    check('numero_usos', 'El número de usos debe ser un número entre 1 y 365').optional().isInt({ min: 1, max: 365 }),
    check('areas_permitidas', 'Las áreas permitidas deben ser un array').optional().isArray(),
    check('notas_adicionales', 'Las notas adicionales deben ser texto').optional().trim(),
    check('estado', 'El estado debe ser válido').optional().isIn(['pendiente', 'confirmado', 'cancelado', 'completado']),
    validarResultados
];

