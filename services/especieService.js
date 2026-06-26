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
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return especie;
};

const update = async (id, data) => {
  const especie = await Especie.findById(id);
  if (!especie || !especie.active) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return Especie.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const remove = async (id) => {
  const dependencias = await Animal.exists({ especie: id, active: true });
  if (dependencias) {
    const err = new Error('No se puede desactivar la especie porque tiene animales activos asociados');
    err.statusCode = 409;
    throw err;
  }
  const especie = await Especie.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!especie) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return especie;
};

module.exports = { list, create, getById, update, remove };
