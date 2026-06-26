const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const config = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw createError('Acceso no autorizado', 401);
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || !usuario.active) {
      throw createError('Usuario no encontrado o desactivado', 401);
    }

    if (usuario.tokenVersion !== decoded.tokenVersion) {
      throw createError('Token invalido (sesion expirada)', 401);
    }

    req.usuario = usuario;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.statusCode = 401;
      err.message = 'Token invalido o expirado';
    }
    next(err);
  }
};

module.exports = auth;
