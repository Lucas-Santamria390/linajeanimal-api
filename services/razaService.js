const Raza = require('../models/Raza');
const Especie = require('../models/Especie');

const list = async (filters = {}) => {
  const query = { active: true };
  if (filters.especie) query.especie = filters.especie;
  return Raza.find(query).populate('especie', 'nombre').sort({ nombre: 1 });
};

const create = async (data) => {
  const especie = await Especie.findById(data.especie);
  if (!especie || !especie.active) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return Raza.create(data);
};

const getById = async (id) => {
  const raza = await Raza.findById(id).populate('especie', 'nombre');
  if (!raza || !raza.active) {
    const err = new Error('Raza no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return raza;
};

const update = async (id, data) => {
  if (data.especie) {
    const especie = await Especie.findById(data.especie);
    if (!especie || !especie.active) {
      const err = new Error('Especie no encontrada');
      err.statusCode = 404;
      throw err;
    }
  }
  const raza = await Raza.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('especie', 'nombre');
  if (!raza || !raza.active) {
    const err = new Error('Raza no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return raza;
};

const remove = async (id) => {
  const raza = await Raza.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!raza) {
    const err = new Error('Raza no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return raza;
};

module.exports = { list, create, getById, update, remove };
