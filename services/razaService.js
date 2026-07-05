// Capa servicio: lógica de negocio de razas, separada del controlador HTTP
const createError = require('../utils/createError');
const Raza = require('../models/Raza');
const Especie = require('../models/Especie');
const Animal = require('../models/Animal');

// GET — lista razas activas, opcionalmente filtradas por especie
const list = async (filters = {}) => {
  const query = { active: true };
  if (filters.especie) query.especie = filters.especie;
  return Raza.find(query).populate('especie', 'nombre').sort({ nombre: 1 });
};

// POST — crea una raza validando que la especie exista y esté activa
const create = async (data) => {
  const especie = await Especie.findById(data.especie);
  if (!especie || !especie.active) {
    throw createError('Especie no encontrada', 404);
  }
  return Raza.create(data);
};

// GET /:id — obtiene una raza por ID, valida que exista y esté activa
const getById = async (id) => {
  const raza = await Raza.findById(id).populate('especie', 'nombre');
  if (!raza || !raza.active) {
    throw createError('Raza no encontrada', 404);
  }
  return raza;
};

// PUT /:id — actualiza raza, valida especie destino y sincroniza nombre en animales
const update = async (id, data) => {
  const raza = await Raza.findById(id);
  if (!raza || !raza.active) {
    throw createError('Raza no encontrada', 404);
  }
  const ALLOWED_FIELDS = ['nombre', 'descripcion', 'especie'];
  const payload = {};
  for (const field of ALLOWED_FIELDS) {
    if (data[field] !== undefined) payload[field] = data[field];
  }
  // Si cambia la especie, valida que la nueva exista
  if (payload.especie) {
    const especie = await Especie.findById(payload.especie);
    if (!especie || !especie.active) {
      throw createError('Especie no encontrada', 404);
    }
  }
  const razaActualizada = await Raza.findByIdAndUpdate(id, payload, { new: true, runValidators: true }).populate('especie', 'nombre');

  // Sincroniza el nombre embebido en todos los animales de esta raza
  if (payload.nombre) {
    try {
      await Animal.updateMany(
        { 'raza._id': id },
        { 'raza.nombre': payload.nombre }
      );
    } catch (syncError) {
      console.error('Error sincronizando nombre de raza en Animal:', syncError);
    }
  }

  return razaActualizada;
};

// DELETE /:id — soft delete: bloquea si hay animales activos vinculados
const deactivate = async (id) => {
  const dependencias = await Animal.exists({ 'raza._id': id, active: true });
  if (dependencias) {
    throw createError('No se puede desactivar la raza porque tiene animales activos asociados', 409);
  }
  const raza = await Raza.findByIdAndUpdate(id, { active: false }, { new: true });
  if (!raza) {
    throw createError('Raza no encontrada', 404);
  }
  return raza;
};

module.exports = { list, create, getById, update, deactivate };
