const createError = require('../utils/createError');
const Raza = require('../models/Raza');
const Especie = require('../models/Especie');
const Animal = require('../models/Animal');

const list = async (filters = {}) => {
  const query = { active: true };
  if (filters.especie) query.especie = filters.especie;
  return Raza.find(query).populate('especie', 'nombre').sort({ nombre: 1 });
};

const create = async (data) => {
  const especie = await Especie.findById(data.especie);
  if (!especie || !especie.active) {
    throw createError('Especie no encontrada', 404);
  }
  return Raza.create(data);
};

const getById = async (id) => {
  const raza = await Raza.findById(id).populate('especie', 'nombre');
  if (!raza || !raza.active) {
    throw createError('Raza no encontrada', 404);
  }
  return raza;
};

const update = async (id, data) => {
  const raza = await Raza.findById(id);
  if (!raza || !raza.active) {
    throw createError('Raza no encontrada', 404);
  }
  const ALLOWED_FIELDS = ['nombre', 'descripcion', 'especie'];
  const payload = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) payload[field] = data[field];
  }
  if (payload.especie) {
    const especie = await Especie.findById(payload.especie);
    if (!especie || !especie.active) {
      throw createError('Especie no encontrada', 404);
    }
  }
  const razaActualizada = await Raza.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate('especie', 'nombre');

  if (payload.nombre) {
    try {
      await Animal.updateMany(
        { 'raza._id': id },
        { 'raza.nombre': payload.nombre }
      );
    } catch (syncError) {
      console.error('Error sincronizando nombre de raza en Animal:', syncError);
    }
  }

  return razaActualizada;
};

const remove = async (id) => {
  const dependencias = await Animal.exists({ 'raza._id': id, active: true });
  if (dependencias) {
    throw createError('No se puede desactivar la raza porque tiene animales activos asociados', 409);
  }
  const raza = await Raza.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!raza) {
    throw createError('Raza no encontrada', 404);
  }
  return raza;
};

module.exports = { list, create, getById, update, remove };
