const especieService = require('../services/especieService');

const listar = async (req, res, next) => {
  try {
    const especies = await especieService.listar();
    res.json({ success: true, data: especies });
  } catch (err) {
    next(err);
  }
};

const crear = async (req, res, next) => {
  try {
    const especie = await especieService.crear(req.body);
    res.status(201).json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

const obtenerPorId = async (req, res, next) => {
  try {
    const especie = await especieService.obtenerPorId(req.params.id);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

const actualizar = async (req, res, next) => {
  try {
    const especie = await especieService.actualizar(req.params.id, req.body);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

const eliminar = async (req, res, next) => {
  try {
    const especie = await especieService.eliminar(req.params.id);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

module.exports = { listar, crear, obtenerPorId, actualizar, eliminar };
