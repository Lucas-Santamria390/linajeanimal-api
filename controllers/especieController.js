const especieService = require('../services/especieService');

const list = async (req, res, next) => {
  try {
    const especies = await especieService.list();
    res.json({ success: true, data: especies });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const especie = await especieService.create(req.body);
    res.status(201).json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const especie = await especieService.getById(req.params.id);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const especie = await especieService.update(req.params.id, req.body);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const especie = await especieService.remove(req.params.id);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getById, update, remove };
