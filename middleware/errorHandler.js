const config = require('../config/env');
const { logSecurityEvent, EventTypes, extractReqMeta } = require('./securityLogger');

// Middleware manejador centralizado de errores (Express los recibe con 4 parámetros)
const errorHandler = (err, req, res, next) => {
  // Toma el código de estado del error o 500 por defecto
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Mapea errores conocidos de Mongoose a códigos HTTP semánticos
  if (err.name === 'ValidationError') {
    // Error de validación de esquema (ej: campo requerido faltante)
    statusCode = 400;
  } else if (err.name === 'CastError') {
    // ID de MongoDB malformado (ej: ObjectId inválido)
    statusCode = 400;
    message = 'ID inválido';
  } else if (err.code === 11000) {
    // Código 11000 = violación de índice único (duplicado)
    statusCode = 409;
    message = 'El recurso ya existe (duplicado)';
  }

  // Solo logea errores de servidor (500+) como eventos de seguridad
  if (statusCode >= 500) {
    logSecurityEvent(EventTypes.ERROR, {
      ...extractReqMeta(req),
      userId: req.usuario?._id,
      userEmail: req.usuario?.email,
      statusCode,
      message,
      errorName: err.name,
      // En desarrollo incluye el stack trace para depuración
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  // Respuesta JSON siempre con success: false
  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace solo visible en desarrollo
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
