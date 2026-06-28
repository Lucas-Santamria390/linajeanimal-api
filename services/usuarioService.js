const createError = require('../utils/createError');
const Usuario = require('../models/Usuario');
const { logSecurityEvent, EventTypes } = require('../middleware/securityLogger');

const list = async (query = {}) => {
  const filters = {};
  filters.active = query.active !== undefined ? query.active : true;

  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [total, usuarios] = await Promise.all([
    Usuario.countDocuments(filters),
    Usuario.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    data: usuarios,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  const usuario = await Usuario.findById(id);
  if (!usuario || !usuario.active) {
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
    logSecurityEvent(EventTypes.SELF_DEACTIVATE_BLOCKED, {
      adminId,
      message: `Admin ${adminId} intento desactivar su propia cuenta`,
    });
    throw createError('No puedes desactivar tu propia cuenta', 400);
  }

  const usuario = await Usuario.findByIdAndUpdate(id, { active: false }, { new: true, runValidators: true });
  if (!usuario) {
    throw createError('Usuario no encontrado', 404);
  }

  logSecurityEvent(EventTypes.USER_DEACTIVATED, {
    userId: id,
    userEmail: usuario.email,
    adminId,
    message: `Usuario ${usuario.email} desactivado por admin ${adminId}`,
  });

  return usuario;
};

const setActive = async (id, active, adminId) => {
  if (id === adminId.toString() && active === false) {
    logSecurityEvent(EventTypes.SELF_DEACTIVATE_BLOCKED, {
      adminId,
      message: `Admin ${adminId} intento desactivar su propia cuenta via PATCH`,
    });
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

  if (active) {
    logSecurityEvent(EventTypes.USER_ACTIVATED, {
      userId: id,
      userEmail: usuario.email,
      adminId,
      message: `Usuario ${usuario.email} reactivado por admin ${adminId}`,
    });
  } else {
    logSecurityEvent(EventTypes.USER_DEACTIVATED, {
      userId: id,
      userEmail: usuario.email,
      adminId,
      message: `Usuario ${usuario.email} desactivado por admin ${adminId} via PATCH`,
    });
  }

  return usuario;
};

module.exports = { list, getById, create, update, deactivate, setActive };
