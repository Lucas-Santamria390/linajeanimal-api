const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const config = require('../config/env');

const generateToken = (id, rol, tokenVersion = 0) => {
  return jwt.sign({ id, rol, tokenVersion }, config.jwtSecret, { expiresIn: '7d' });
};

const register = async (data) => {
  data.rol = 'user';
  const usuario = await Usuario.create(data);
  const token = generateToken(usuario._id, usuario.rol, usuario.tokenVersion);
  return { usuario, token };
};

const login = async (email, password) => {
  const usuario = await Usuario.findOne({ email, active: true }).select('+password');
  if (!usuario) {
    throw createError('Email o contraseña incorrectos', 401);
  }

  const isValid = await usuario.compararPassword(password);
  if (!isValid) {
    throw createError('Email o contraseña incorrectos', 401);
  }

  const token = generateToken(usuario._id, usuario.rol, usuario.tokenVersion);
  return { usuario, token };
};

const changePassword = async (usuarioId, currentPassword, newPassword) => {
  const usuario = await Usuario.findById(usuarioId).select('+password');
  if (!usuario || !usuario.active) {
    throw createError('Usuario no encontrado', 404);
  }

  const isValid = await usuario.compararPassword(currentPassword);
  if (!isValid) {
    throw createError('La contraseña actual es incorrecta', 401);
  }

  usuario.password = newPassword;
  usuario.tokenVersion += 1;
  await usuario.save();

  const token = generateToken(usuario._id, usuario.rol, usuario.tokenVersion);
  return { usuario, token };
};

const logout = async (usuarioId) => {
  await Usuario.findByIdAndUpdate(usuarioId, { $inc: { tokenVersion: 1 } });
};

const getProfile = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario || !usuario.active) {
    throw createError('Usuario no encontrado', 404);
  }
  return usuario;
};

module.exports = { register, login, changePassword, logout, getProfile };
