// Capa controlador: recibe las peticiones HTTP, delega en el servicio y responde JSON
const razaService = require('../services/razaService');

// GET /api/v1/razas — lista todas las razas, opcionalmente filtradas por especie
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

// POST /api/v1/razas — crea una nueva raza vinculada a una especie existente
const create = async (req, res, next) => {
  try {
    const raza = await razaService.create(req.body);
    res.status(201).json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/razas/:id — obtiene una raza por su ID
const getById = async (req, res, next) => {
  try {
    const raza = await razaService.getById(req.params.id);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/razas/:id — actualiza una raza (nombre, descripción, especie)
const update = async (req, res, next) => {
  try {
    const raza = await razaService.update(req.params.id, req.body);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/razas/:id — soft delete (marca active: false)
const deactivate = async (req, res, next) => {
  try {
    const raza = await razaService.deactivate(req.params.id);
    res.json({ success: true, data: raza });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getById, update, deactivate };
