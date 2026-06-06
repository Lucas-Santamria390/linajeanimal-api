const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config/env');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      const err = new Error('Acceso no autorizado');
      err.statusCode = 401;
      throw err;
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || !usuario.active) {
      const err = new Error('Usuario no encontrado o desactivado');
      err.statusCode = 401;
      throw err;
    }

    req.usuario = usuario;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      err.statusCode = 401;
      err.message = 'Token inválido o expirado';
    }
    next(err);
  }
};

module.exports = auth;
