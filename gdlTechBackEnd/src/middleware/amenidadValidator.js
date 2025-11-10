const { body, validationResult } = require('express-validator');

const amenidadesRules = () => {
  return [
    body('nombre')
      .exists()
      .withMessage('El campo nombre es requerido.')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El nombre solo puede contener letras y espacios.'),
    
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 250 })
      .withMessage('La especialidad no puede exceder los 250 caracteres.'),
    
    body('estado')
      .optional()
      .isIn(['ACTIVO', 'INACTIVO'])
      .withMessage('El estado debe ser ACTIVO o INACTIVO.'),

    body('fecha')
        .escape()
        .notEmpty().withMessage('La fecha es obligatoria.')
        .isISO8601().withMessage('El formato de fecha no es válido.')
        .isAfter(new Date().toISOString()).withMessage('La fecha no puede ser en el pasado.'),

    body('precio')
        .escape()
        .notEmpty().withMessage('El precio es obligatorio.')
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0.')
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));
  return res.status(422).json({ errors: extractedErrors });
};

module.exports = {
  amenidadesRules,
  validate,
};