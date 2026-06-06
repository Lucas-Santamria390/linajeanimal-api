const Especie = require('../models/Especie');

const listar = async () => {
  return Especie.find({ active: true }).sort({ nombre: 1 });
};

const crear = async (data) => {
  return Especie.create(data);
};

const obtenerPorId = async (id) => {
  const especie = await Especie.findById(id);
  if (!especie || !especie.active) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return especie;
};

const actualizar = async (id, data) => {
  const especie = await Especie.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!especie || !especie.active) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return especie;
};

const eliminar = async (id) => {
  const especie = await Especie.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!especie) {
    const err = new Error('Especie no encontrada');
    err.statusCode = 404;
    throw err;
  }
  return especie;
};

module.exports = { listar, crear, obtenerPorId, actualizar, eliminar };
