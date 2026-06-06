const Raza = require('../models/Raza');
const Especie = require('../models/Especie');

const listar = async (filtros = {}) => {
  const query = { active: true };
  if (filtros.especie) query.especie = filtros.especie;
  return Raza.find(query).populate('especie', 'nombre').sort({ nombre: 1 });
};

const crear = async (data) => {
  const especie = await Especie.findById(data.especie);
  if (!especie || !especie.active) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return Raza.create(data);
};

const obtenerPorId = async (id) => {
  const raza = await Raza.findById(id).populate('especie', 'nombre');
  if (!raza || !raza.active) {
    const err = new Error('Raza no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return raza;
};

const actualizar = async (id, data) => {
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

const eliminar = async (id) => {
  const raza = await Raza.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!raza) {
    const err = new Error('Raza no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return raza;
};

module.exports = { listar, crear, obtenerPorId, actualizar, eliminar };
