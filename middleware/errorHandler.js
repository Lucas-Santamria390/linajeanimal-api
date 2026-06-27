const config = require('../config/env');
const { logSecurityEvent, EventTypes, extractReqMeta } = require('./securityLogger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'ID inválido';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'El recurso ya existe (duplicado)';
  }

  if (statusCode >= 500) {
    logSecurityEvent(EventTypes.ERROR, {
      ...extractReqMeta(req),
      userId: req.usuario?._id,
      userEmail: req.usuario?.email,
      statusCode,
      message,
      errorName: err.name,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
