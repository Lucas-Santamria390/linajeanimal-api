const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config/env');

const generarToken = (id, rol) => {
  return jwt.sign({ id, rol }, config.jwtSecret, { expiresIn: '7d' });
};

const register = async (data) => {
  const usuario = await Usuario.create(data);
  const token = generarToken(usuario._id, usuario.rol);
  return { usuario, token };
};

const login = async (email, password) => {
  const usuario = await Usuario.findOne({ email, active: true }).select('+password');
  if (!usuario) {
    const err = new Error('Email o contraseña incorrectos');
    err.statusCode = 401;
    throw err;
  }

  const esValido = await usuario.compararPassword(password);
  if (!esValido) {
    const err = new Error('Email o contraseña incorrectos');
    err.statusCode = 401;
    throw err;
  }

  const token = generarToken(usuario._id, usuario.rol);
  return { usuario, token };
};

const getProfile = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario || !usuario.active) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return usuario;
};

module.exports = { register, login, getProfile };
