const usuarioService = require('../services/usuarioService');

const list = async (req, res, next) => {
  try {
    const usuarios = await usuarioService.list();
    res.json({ success: true, data: usuarios });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const usuario = await usuarioService.deactivate(req.params.id, req.usuario._id);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, deactivate };
