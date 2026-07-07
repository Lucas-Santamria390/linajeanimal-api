const mongoose = require('mongoose');
const Animal = require('../models/Animal');
const Especie = require('../models/Especie');
const Raza = require('../models/Raza');

const createError = require('../utils/createError');
const { toId, isValidId } = require('../utils/animalHelpers');

const validateSpeciesAndBreed = async (especieId, razaId) => {
  if (!isValidId(especieId)) {
    throw createError('La especie no es valida');
  }

  if (!isValidId(razaId)) {
    throw createError('La raza no es valida');
  }

  const [especie, raza] = await Promise.all([
    Especie.findById(especieId),
    Raza.findById(razaId),
  ]);

  if (!especie || !especie.active) {
    throw createError('La especie no existe o esta desactivada', 404);
  }

  if (!raza || !raza.active) {
    throw createError('La raza no existe o esta desactivada', 404);
  }

  if (toId(raza.especie) !== toId(especie._id)) {
    throw createError('La raza no pertenece a la especie indicada');
  }

  return { especie, raza };
};

const isDescendantOf = async (rootId, targetId, visited = new Set()) => {
  const rootKey = toId(rootId);
  if (!rootKey || visited.has(rootKey)) {
    return false;
  }

  visited.add(rootKey);

  const children = await Animal.find({
    $or: [{ padre: rootId }, { madre: rootId }],
  }).select('_id');

  for (const child of children) {
    if (toId(child._id) === toId(targetId)) {
      return true;
    }

    if (await isDescendantOf(child._id, targetId, visited)) {
      return true;
    }
  }

  return false;
};

const validateExistingParent = async ({ animal, speciesId, parentId, expectedSex, label }) => {
  if (parentId === undefined || parentId === null) {
    return null;
  }

  if (!isValidId(parentId)) {
    throw createError(`El ${label} no es valido`);
  }

  const parent = await Animal.findById(parentId);
  if (!parent || !parent.active) {
    throw createError(`El ${label} no existe o esta desactivado`, 404);
  }

  if (animal && toId(parent._id) === toId(animal._id)) {
    throw createError(`El ${label} no puede ser el mismo animal`);
  }

  if (parent.sexo !== expectedSex) {
    throw createError(`El ${label} debe ser ${expectedSex}`);
  }

  const parentEspecieId = parent.especie._id || parent.especie;
  if (speciesId && toId(parentEspecieId) !== toId(speciesId)) {
    throw createError(`El ${label} debe pertenecer a la misma especie`);
  }

  if (animal) {
    const descendant = await isDescendantOf(animal._id, parent._id);
    if (descendant) {
      throw createError(`El ${label} no puede ser descendiente del animal`);
    }
  }

  return parent._id;
};

module.exports = {
  validateSpeciesAndBreed,
  validateExistingParent,
  isDescendantOf,
};
