const createError = require('../utils/createError');
const Especie = require('../models/Especie');
const Animal = require('../models/Animal');

const list = async () => {
  return Especie.find({ active: true }).sort({ nombre: 1 });
};

const create = async (data) => {
  return Especie.create(data);
};

const getById = async (id) => {
  const especie = await Especie.findById(id);
  if (!especie || !especie.active) {
    throw createError('Especie no encontrada', 404);
  }
  return especie;
};

const update = async (id, data) => {
  const especie = await Especie.findById(id);
  if (!especie || !especie.active) {
    throw createError('Especie no encontrada', 404);
  }
  const ALLOWED_FIELDS = ['nombre', 'descripcion'];
  const payload = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) payload[field] = data[field];
  }
  const especieActualizada = await Especie.findByIdAndUpdate(id, payload, { new: true, runValidators: true });

  if (payload.nombre) {
    try {
      await Animal.updateMany(
        { 'especie._id': id },
        { 'especie.nombre': payload.nombre }
      );
    } catch (syncError) {
      console.error('Error sincronizando nombre de especie en Animal:', syncError);
    }
  }

  return especieActualizada;
};

const deactivate = async (id) => {
  const dependencias = await Animal.exists({ 'especie._id': id, active: true });
  if (dependencias) {
    throw createError('No se puede desactivar la especie porque tiene animales activos asociados', 409);
  }
  const especie = await Especie.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!especie) {
    throw createError('Especie no encontrada', 404);
  }
  return especie;
};

module.exports = { list, create, getById, update, deactivate };
