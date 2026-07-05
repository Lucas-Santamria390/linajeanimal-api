// Importa validationResult para obtener los errores de express-validator
const { validationResult } = require('express-validator');

// Middleware que valida los resultados de las reglas de express-validator
// Debe colocarse DESPUÉS de las reglas de validación en la ruta
const validarCampos = (req, res, next) => {
  // Extrae los errores acumulados por las validaciones previas
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Concatena todos los mensajes de error en uno solo separado por ";"
    const messages = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ success: false, message: messages });
  }
  // Si no hay errores, continúa al siguiente middleware/controlador
  next();
};

module.exports = validarCampos;
