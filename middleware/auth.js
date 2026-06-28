const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const config = require('../config/env');
const { logSecurityEvent, EventTypes, extractReqMeta } = require('./securityLogger');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      logSecurityEvent(EventTypes.TOKEN_INVALID, {
        ...extractReqMeta(req),
        message: 'Token no proporcionado',
      });
      throw createError('Acceso no autorizado', 401);
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || !usuario.active) {
      logSecurityEvent(EventTypes.USER_DEACTIVATED, {
        ...extractReqMeta(req),
        userId: decoded.id,
        message: 'Intento de acceso con usuario desactivado',
      });
      throw createError('Usuario no encontrado o desactivado', 401);
    }

    if (usuario.tokenVersion !== decoded.tokenVersion) {
      logSecurityEvent(EventTypes.TOKEN_INVALID, {
        ...extractReqMeta(req),
        userId: decoded.id,
        message: 'Token con tokenVersion desactualizado (sesion expirada)',
      });
      throw createError('Token invalido (sesion expirada)', 401);
    }

    req.usuario = usuario;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      logSecurityEvent(EventTypes.TOKEN_INVALID, {
        ...extractReqMeta(req),
        message: 'Token JWT malformado',
        details: err.message,
      });
      err.statusCode = 401;
      err.message = 'Token invalido o expirado';
    } else if (err.name === 'TokenExpiredError') {
      logSecurityEvent(EventTypes.TOKEN_EXPIRED, {
        ...extractReqMeta(req),
        message: 'Token JWT expirado',
        details: err.message,
      });
      err.statusCode = 401;
      err.message = 'Token invalido o expirado';
    }
    next(err);
  }
};

module.exports = auth;
