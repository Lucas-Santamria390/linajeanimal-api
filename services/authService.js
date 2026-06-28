const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const config = require('../config/env');
const { logSecurityEvent, EventTypes } = require('../middleware/securityLogger');

const generateToken = (id, rol, tokenVersion = 0) => {
  return jwt.sign({ id, rol, tokenVersion }, config.jwtSecret, { expiresIn: '7d' });
};

const register = async (data) => {
  data.rol = 'user';
  const usuario = await Usuario.create(data);
  const token = generateToken(usuario._id, usuario.rol, usuario.tokenVersion);
  logSecurityEvent(EventTypes.REGISTER_SUCCESS, {
    userId: usuario._id,
    email: usuario.email,
    message: `Nuevo usuario registrado: ${usuario.email}`,
  });
  return { usuario, token };
};

const login = async (email, password) => {
  const usuario = await Usuario.findOne({ email, active: true }).select('+password');
  if (!usuario) {
    logSecurityEvent(EventTypes.LOGIN_FAILED, {
      email,
      message: `Intento de login con email no registrado: ${email}`,
    });
    throw createError('Email o contraseña incorrectos', 401);
  }

  const isValid = await usuario.compararPassword(password);
  if (!isValid) {
    logSecurityEvent(EventTypes.LOGIN_FAILED, {
      email,
      userId: usuario._id,
      message: `Intento de login con contraseña incorrecta: ${email}`,
    });
    throw createError('Email o contraseña incorrectos', 401);
  }

  const token = generateToken(usuario._id, usuario.rol, usuario.tokenVersion);
  logSecurityEvent(EventTypes.LOGIN_SUCCESS, {
    userId: usuario._id,
    email: usuario.email,
    message: `Login exitoso: ${usuario.email}`,
  });
  return { usuario, token };
};

const changePassword = async (usuarioId, currentPassword, newPassword) => {
  const usuario = await Usuario.findById(usuarioId).select('+password');
  if (!usuario || !usuario.active) {
    throw createError('Usuario no encontrado', 404);
  }

  const isValid = await usuario.compararPassword(currentPassword);
  if (!isValid) {
    logSecurityEvent(EventTypes.PASSWORD_CHANGED, {
      userId: usuarioId,
      email: usuario?.email,
      message: `Intento fallido de cambio de contraseña para usuario ${usuarioId}`,
      success: false,
    });
    throw createError('La contraseña actual es incorrecta', 401);
  }

  usuario.password = newPassword;
  usuario.tokenVersion += 1;
  await usuario.save();

  logSecurityEvent(EventTypes.PASSWORD_CHANGED, {
    userId: usuarioId,
    email: usuario.email,
    message: `Contraseña cambiada exitosamente para usuario ${usuario.email}`,
    success: true,
  });

  const token = generateToken(usuario._id, usuario.rol, usuario.tokenVersion);
  return { usuario, token };
};

const logout = async (usuarioId) => {
  await Usuario.findByIdAndUpdate(usuarioId, { $inc: { tokenVersion: 1 } });
  logSecurityEvent(EventTypes.LOGOUT, {
    userId: usuarioId,
    message: `Usuario ${usuarioId} cerro sesion`,
  });
};

const getProfile = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario || !usuario.active) {
    throw createError('Usuario no encontrado', 404);
  }
  return usuario;
};

module.exports = { register, login, changePassword, logout, getProfile, generateToken };
