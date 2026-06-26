const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: { usuario: result.usuario, token: result.token } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: { usuario: result.usuario, token: result.token } });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.usuario._id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, data: { usuario: result.usuario, token: result.token } });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.usuario._id);
    res.json({ success: true, message: 'Sesion cerrada exitosamente' });
  } catch (err) {
    next(err);
  }
};

const profile = async (req, res, next) => {
  try {
    const usuario = await authService.getProfile(req.usuario._id);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, changePassword, logout, profile };
