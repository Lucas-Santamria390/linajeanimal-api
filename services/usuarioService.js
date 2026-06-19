const Usuario = require('../models/Usuario');

const list = async () => {
  return Usuario.find().sort({ createdAt: -1 });
};

const getById = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
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
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const updatable = {};
  if (data.nombre !== undefined) updatable.nombre = data.nombre;
  if (data.email !== undefined) updatable.email = data.email;
  if (data.rol !== undefined) updatable.rol = data.rol;

  if (!Object.keys(updatable).length) {
    const err = new Error('No se enviaron campos para actualizar');
    err.statusCode = 400;
    throw err;
  }

  return Usuario.findByIdAndUpdate(id, updatable, { new: true, runValidators: true });
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

const setActive = async (id, active, adminId) => {
  if (id === adminId.toString() && active === false) {
    const err = new Error('No puedes desactivar tu propia cuenta');
    err.statusCode = 400;
    throw err;
  }

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { active },
    { new: true, runValidators: true }
  );

  if (!usuario) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  return usuario;
};

module.exports = { list, getById, create, update, deactivate, setActive };
