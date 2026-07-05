// Capa controlador: recibe las peticiones HTTP, delega en el servicio y responde JSON
const animalService = require('../services/animalService');

// GET /api/v1/animales — lista animales con filtros, paginación y permisos por propietario
const list = async (req, res, next) => {
  try {
    const result = await animalService.list(req.query, req.usuario);
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/animales — crea un nuevo animal (asigna req.usuario._id como propietario)
const create = async (req, res, next) => {
  try {
    const animal = await animalService.create(req.body, req.usuario._id);
    res.status(201).json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animales/:id — obtiene un animal por ID (verifica permisos de propietario)
const getById = async (req, res, next) => {
  try {
    const animal = await animalService.getById(req.params.id, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/animales/:id — actualiza un animal (verifica permisos de propietario)
const update = async (req, res, next) => {
  try {
    const animal = await animalService.update(req.params.id, req.body, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/animales/:id — soft delete (marca active: false, solo admin)
const deactivate = async (req, res, next) => {
  try {
    const animal = await animalService.deactivate(req.params.id, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animales/:id/family-tree — árbol genealógico con profundidad configurable
const tree = async (req, res, next) => {
  try {
    const generations = req.query.generaciones || req.query.depth;
    const animal = await animalService.getTree(req.params.id, generations, req.usuario);
    res.json({ success: true, data: animal });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animales/:id/children — lista los hijos directos del animal
const children = async (req, res, next) => {
  try {
    const animals = await animalService.getChildren(req.params.id, req.usuario);
    res.json({ success: true, data: animals });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/animales/:id/siblings — lista los hermanos (mismo padre o madre)
const siblings = async (req, res, next) => {
  try {
    const animals = await animalService.getSiblings(req.params.id, req.usuario);
    res.json({ success: true, data: animals });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/animales/:id/parents — asigna padre y/o madre al animal
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
