const razaService = require('../services/razaService');

const list = async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.especie) filters.especie = req.query.especie;
    const razas = await razaService.list(filters);
    res.json({ success: true, data: razas });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const raza = await razaService.create(req.body);
    res.status(201).json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const raza = await razaService.getById(req.params.id);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const raza = await razaService.update(req.params.id, req.body);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const raza = await razaService.deactivate(req.params.id);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getById, update, deactivate };
