// Capa controlador: recibe las peticiones HTTP, delega en el servicio y responde JSON
const authService = require('../services/authService');

// POST /api/v1/auth/register — registra un nuevo usuario y devuelve token JWT
const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: { usuario: result.usuario, token: result.token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/login — autentica usuario por email+password y devuelve token JWT
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: { usuario: result.usuario, token: result.token } });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/auth/change-password — cambia la contraseña (requiere contraseña actual)
const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.usuario._id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, data: { usuario: result.usuario, token: result.token } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/auth/logout — invalida la sesión actual (incrementa tokenVersion)
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.usuario._id);
    res.json({ success: true, message: 'Sesion cerrada exitosamente' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/auth/profile — devuelve el perfil del usuario autenticado
const profile = async (req, res, next) => {
  try {
    const usuario = await authService.getProfile(req.usuario._id);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, changePassword, logout, profile };
