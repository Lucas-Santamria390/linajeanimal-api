const razaService = require('../services/razaService');

const listar = async (req, res, next) => {
  try {
    const filtros = {};
    if (req.query.especie) filtros.especie = req.query.especie;
    const razas = await razaService.listar(filtros);
    res.json({ success: true, data: razas });
  } catch (err) {
    next(err);
  }
};

const crear = async (req, res, next) => {
  try {
    const raza = await razaService.crear(req.body);
    res.status(201).json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const raza = await razaService.obtenerPorId(req.params.id);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const raza = await razaService.actualizar(req.params.id, req.body);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const raza = await razaService.eliminar(req.params.id);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, crear, obtenerPorId, actualizar, eliminar };
