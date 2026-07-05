// Capa servicio: lógica de negocio de especies, separada del controlador HTTP
const createError = require('../utils/createError');
const Especie = require('../models/Especie');
const Animal = require('../models/Animal');

// GET — lista especies activas ordenadas alfabéticamente
const list = async () => {
  return Especie.find({ active: true }).sort({ nombre: 1 });
};

// POST — crea una nueva especie
const create = async (data) => {
  return Especie.create(data);
};

// GET /:id — obtiene una especie por ID, valida que exista y esté activa
const getById = async (id) => {
  const especie = await Especie.findById(id);
  if (!especie || !especie.active) {
    throw createError('Especie no encontrada', 404);
  }
  return especie;
};

// PUT /:id — actualiza nombre/descripción y sincroniza el nombre en los animales vinculados
const update = async (id, data) => {
  const especie = await Especie.findById(id);
  if (!especie || !especie.active) {
    throw createError('Especie no encontrada', 404);
  }
  const ALLOWED_FIELDS = ['nombre', 'descripcion'];
  const payload = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) payload[field] = data[field];
  }
  const especieActualizada = await Especie.findByIdAndUpdate(id, payload, { new: true, runValidators: true });

  // Sincroniza el nombre embebido en todos los animales de esta especie
  if (payload.nombre) {
    try {
      await Animal.updateMany(
        { 'especie._id': id },
        { 'especie.nombre': payload.nombre }
      );
    } catch (syncError) {
      console.error('Error sincronizando nombre de especie en Animal:', syncError);
    }
  }

  return especieActualizada;
};

// DELETE /:id — soft delete: bloquea si hay animales activos vinculados
const deactivate = async (id) => {
  const dependencias = await Animal.exists({ 'especie._id': id, active: true });
  if (dependencias) {
    throw createError('No se puede desactivar la especie porque tiene animales activos asociados', 409);
  }
  const especie = await Especie.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!especie) {
    throw createError('Especie no encontrada', 404);
  }
  return especie;
};

module.exports = { list, create, getById, update, deactivate };
