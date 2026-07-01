const animalService = require('../services/animalService');

const list = async (req, res, next) => {
  try {
    const result = await animalService.list(req.query, req.usuario);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const animal = await animalService.create(req.body, req.usuario._id);
    res.status(201).json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const animal = await animalService.getById(req.params.id, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const animal = await animalService.update(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const animal = await animalService.deactivate(req.params.id, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

const tree = async (req, res, next) => {
  try {
    const generations = req.query.generaciones || req.query.depth;
    const animal = await animalService.getTree(req.params.id, generations, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

const children = async (req, res, next) => {
  try {
    const animals = await animalService.getChildren(req.params.id, req.usuario);
    res.json({ success: true, data: animals });
  } catch (err) {
    next(err);
  }
};

const siblings = async (req, res, next) => {
  try {
    const animals = await animalService.getSiblings(req.params.id, req.usuario);
    res.json({ success: true, data: animals });
  } catch (err) {
    next(err);
  }
};

const assignParents = async (req, res, next) => {
  try {
    const animal = await animalService.assignParents(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  create,
  getById,
  update,
  deactivate,
  tree,
  children,
  siblings,
  assignParents,
};
