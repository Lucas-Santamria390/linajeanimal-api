// Capa controlador: recibe las peticiones HTTP, delega en el servicio y responde JSON
const especieService = require('../services/especieService');

// GET /api/v1/especies — lista especies, opcionalmente filtradas por ?active=
const list = async (req, res, next) => {
  try {
    const especies = await especieService.list(req.query);
    res.json({ success: true, data: especies });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/especies — crea una nueva especie
const create = async (req, res, next) => {
  try {
    const especie = await especieService.create(req.body);
    res.status(201).json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/especies/:id — obtiene una especie por su ID
const getById = async (req, res, next) => {
  try {
    const especie = await especieService.getById(req.params.id);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/especies/:id — actualiza una especie (nombre, descripción)
const update = async (req, res, next) => {
  try {
    const especie = await especieService.update(req.params.id, req.body);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/especies/:id — soft delete (marca active: false)
const deactivate = async (req, res, next) => {
  try {
    const especie = await especieService.deactivate(req.params.id);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/especies/:id — activa o desactiva una especie
const setActive = async (req, res, next) => {
  try {
    const especie = await especieService.setActive(req.params.id, req.body.active);
    res.json({ success: true, data: especie });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, getById, update, deactivate, setActive };
