const Usuario = require('../models/Usuario');

const list = async () => {
  return Usuario.find().sort({ createdAt: -1 });
};

const deactivate = async (id, adminId) => {
  if (id === adminId.toString()) {
    const err = new Error('No puedes desactivar tu propia cuenta');
    err.statusCode = 400;
    throw err;
  }

  const usuario = await Usuario.findByIdAndUpdate(id, { active: false }, { new: true, runValidators: true });
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return usuario;
};

module.exports = { list, deactivate };
