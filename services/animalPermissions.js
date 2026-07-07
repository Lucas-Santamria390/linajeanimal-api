const Animal = require('../models/Animal');

const createError = require('../utils/createError');
const { toId, isValidId, populateAnimalRelations } = require('../utils/animalHelpers');

const assertCanReadAnimal = (animal, usuario) => {
  if (!usuario || usuario.rol === 'admin') {
    return;
  }

  const propietarioId = animal.propietario._id || animal.propietario;
  if (toId(propietarioId) !== toId(usuario._id)) {
    throw createError('No tienes permisos para ver este animal', 403);
  }
};

const assertCanManageAnimal = (animal, usuario) => {
  if (usuario?.rol === 'admin') {
    return;
  }

  const propietarioId = animal.propietario._id || animal.propietario;
  if (!usuario || toId(propietarioId) !== toId(usuario._id)) {
    throw createError('No tienes permisos para realizar esta accion', 403);
  }
};

const getActiveAnimalOrThrow = async (id, usuario) => {
  if (!isValidId(id)) {
    throw createError('ID invalido', 400);
  }

  const animal = await populateAnimalRelations(Animal.findById(id));
  if (!animal || !animal.active) {
    throw createError('Animal no encontrado', 404);
  }

  if (usuario) {
    assertCanReadAnimal(animal, usuario);
  }

  return animal;
};

module.exports = {
  assertCanReadAnimal,
  assertCanManageAnimal,
  getActiveAnimalOrThrow,
};
