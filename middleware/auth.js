// Importa jsonwebtoken para verificar tokens JWT
const jwt = require('jsonwebtoken');
// Función para crear errores con código de estado HTTP
const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const config = require('../config/env');
// Utilidades de logging de seguridad
const { logSecurityEvent, EventTypes, extractReqMeta } = require('./securityLogger');

// Middleware de autenticación: verifica que el usuario tenga un token JWT válido
const auth = async (req, res, next) => {
  try {
    // Extrae el header Authorization: "Bearer <token>"
    const header = req.headers.authorization;
    // Si no hay header o no comienza con "Bearer ", rechaza la petición
    if (!header || !header.startsWith('Bearer ')) {
      logSecurityEvent(EventTypes.TOKEN_INVALID, {
        ...extractReqMeta(req),
        message: 'Token no proporcionado',
      });
      throw createError('Acceso no autorizado', 401);
    }

    // Extrae solo el token (después de "Bearer ")
    const token = header.split(' ')[1];
    // Verifica y decodifica el token usando la clave secreta
    const decoded = jwt.verify(token, config.jwtSecret);

    // Busca al usuario en BD por el id del token
    const usuario = await Usuario.findById(decoded.id);
    // Rechaza si el usuario no existe o fue desactivado 
    if (!usuario || !usuario.active) {
      logSecurityEvent(EventTypes.USER_DEACTIVATED, {
        ...extractReqMeta(req),
        userId: decoded.id,
        message: 'Intento de acceso con usuario desactivado',
      });
      throw createError('Usuario no encontrado o desactivado', 401);
    }

    // Verifica que el tokenVersion del usuario coincida (permite invalidar sesiones)
    if (usuario.tokenVersion !== decoded.tokenVersion) {
      logSecurityEvent(EventTypes.TOKEN_INVALID, {
        ...extractReqMeta(req),
        userId: decoded.id,
        message: 'Token con tokenVersion desactualizado (sesion expirada)',
      });
      throw createError('Token invalido (sesion expirada)', 401);
    }

    // Adjunta el usuario a la request para los siguientes middleware/rutas
    req.usuario = usuario;
    next();
  } catch (err) {
    // Maneja errores específicos de JWT (token malformado)
    if (err.name === 'JsonWebTokenError') {
      logSecurityEvent(EventTypes.TOKEN_INVALID, {
        ...extractReqMeta(req),
        message: 'Token JWT malformado',
        details: err.message,
      });
      err.statusCode = 401;
      err.message = 'Token invalido o expirado';
    // Maneja errores de token expirado
    } else if (err.name === 'TokenExpiredError') {
      logSecurityEvent(EventTypes.TOKEN_EXPIRED, {
        ...extractReqMeta(req),
        message: 'Token JWT expirado',
        details: err.message,
      });
      err.statusCode = 401;
      err.message = 'Token invalido o expirado';
    }
    // Pasa el error al manejador centralizado de errores
    next(err);
  }
};

module.exports = auth;
