const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');

const list = async () => {
  return Usuario.find().sort({ createdAt: -1 });
};

const getById = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    throw createError('Usuario no encontrado', 404);
  }
  return usuario;
};

const create = async (data) => {
  const usuarioData = {
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    rol: data.rol || 'user',
  };
  return Usuario.create(usuarioData);
};

const update = async (id, data) => {
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    throw createError('Usuario no encontrado', 404);
  }

  const updatable = {};
  if (data.nombre !== undefined) updatable.nombre = data.nombre;
  if (data.email !== undefined) updatable.email = data.email;
  if (data.rol !== undefined) updatable.rol = data.rol;

  if (!Object.keys(updatable).length) {
    throw createError('No se enviaron campos para actualizar', 400);
  }

  return Usuario.findByIdAndUpdate(id, updatable, { new: true, runValidators: true });
};

const deactivate = async (id, adminId) => {
  if (id === adminId.toString()) {
    throw createError('No puedes desactivar tu propia cuenta', 400);
  }

  const usuario = await Usuario.findByIdAndUpdate(id, { active: false }, { new: true, runValidators: true });
  if (!usuario) {
    throw createError('Usuario no encontrado', 404);
  }

  return usuario;
};

const setActive = async (id, active, adminId) => {
  if (id === adminId.toString() && active === false) {
    throw createError('No puedes desactivar tu propia cuenta', 400);
  }

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { active },
    { new: true, runValidators: true }
  );

  if (!usuario) {
    throw createError('Usuario no encontrado', 404);
  }

  return usuario;
};

module.exports = { list, getById, create, update, deactivate, setActive };
