// Capa controlador: recibe las peticiones HTTP, delega en el servicio y responde JSON
const usuarioService = require('../services/usuarioService');

// GET /api/v1/usuarios — lista usuarios con paginación (pasa query params: page, limit, active)
const list = async (req, res, next) => {
  try {
    const result = await usuarioService.list(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/usuarios/:id — obtiene un usuario por su ID
const getById = async (req, res, next) => {
  try {
    const usuario = await usuarioService.getById(req.params.id);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/usuarios — crea un nuevo usuario (solo admin)
const create = async (req, res, next) => {
  try {
    const usuario = await usuarioService.create(req.body);
    res.status(201).json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

// PUT /api/v1/usuarios/:id — actualiza datos de un usuario (nombre, email, rol)
const update = async (req, res, next) => {
  try {
    const usuario = await usuarioService.update(req.params.id, req.body);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/usuarios/:id — soft delete (marca active: false)
const deactivate = async (req, res, next) => {
  try {
    const usuario = await usuarioService.deactivate(req.params.id, req.usuario._id);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/v1/usuarios/:id — activa/desactiva un usuario (cambia active: true/false)
const setActive = async (req, res, next) => {
  try {
    const usuario = await usuarioService.setActive(req.params.id, req.body.active, req.usuario._id);
    res.json({ success: true, data: usuario });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, deactivate, setActive };
