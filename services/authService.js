// Capa servicio: lógica de negocio de autenticación (register, login, logout, cambio de contraseña)
const jwt = require('jsonwebtoken');
const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const config = require('../config/env');
const { logSecurityEvent, EventTypes } = require('../middleware/securityLogger');

// Genera un token JWT con id, rol y tokenVersion (para invalidar sesiones)
const generateToken = (id, rol, tokenVersion = 0) => {
  return jwt.sign({ id, rol, tokenVersion }, config.jwtSecret, { expiresIn: '7d' });
};

// POST /register — crea usuario (siempre con rol 'user') y devuelve token
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

// POST /login — autentica por email+password, valida active=true y devuelve token
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

// PUT /change-password — cambia contraseña, valida la actual, incrementa tokenVersion
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
  usuario.tokenVersion += 1; // Invalida todos los tokens anteriores
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

// POST /logout — incrementa tokenVersion para invalidar el token actual
const logout = async (usuarioId) => {
  await Usuario.findByIdAndUpdate(usuarioId, { $inc: { tokenVersion: 1 } });
  logSecurityEvent(EventTypes.LOGOUT, {
    userId: usuarioId,
    message: `Usuario ${usuarioId} cerro sesion`,
  });
};

// GET /profile — devuelve datos del usuario autenticado
const getProfile = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario || !usuario.active) {
    throw createError('Usuario no encontrado', 404);
  }
  return usuario;
};

module.exports = { register, login, changePassword, logout, getProfile, generateToken };
