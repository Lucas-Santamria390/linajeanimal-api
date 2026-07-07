const Animal = require('../models/Animal');

const createError = require('../utils/createError');
const { toId, parseDepth, populateAnimalRelations } = require('../utils/animalHelpers');
const { validateExistingParent } = require('./animalValidationService');
const { assertCanManageAnimal, getActiveAnimalOrThrow } = require('./animalPermissions');

const buildTreeNode = async (animalId, maxDepth, currentDepth = 0, visited = new Set()) => {
  if (!animalId || currentDepth > maxDepth) {
    return null;
  }

  const key = toId(animalId);
  if (visited.has(key)) {
    return null;
  }

  visited.add(key);

  const animal = await Animal.findById(animalId)
    .populate('padre', 'nombre sexo especie raza fechaNacimiento active')
    .populate('madre', 'nombre sexo especie raza fechaNacimiento active');

  if (!animal) {
    return null;
  }

  return {
    _id: animal._id,
    identificador: animal.identificador,
    nombre: animal.nombre,
    sexo: animal.sexo,
    fechaNacimiento: animal.fechaNacimiento,
    especie: animal.especie,
    raza: animal.raza,
    propietario: animal.propietario,
    padre: animal.padre ? await buildTreeNode(animal.padre._id, maxDepth, currentDepth + 1, new Set(visited)) : null,
    madre: animal.madre ? await buildTreeNode(animal.madre._id, maxDepth, currentDepth + 1, new Set(visited)) : null,
  };
};

const getTree = async (id, generations, usuario) => {
  const maxDepth = parseDepth(generations);
  const animal = await getActiveAnimalOrThrow(id, usuario);
  const tree = await buildTreeNode(animal._id, maxDepth);
  return {
    generaciones: maxDepth,
    arbol: tree,
  };
};

const getChildren = async (id, usuario) => {
  await getActiveAnimalOrThrow(id, usuario);

  return populateAnimalRelations(
    Animal.find({
      active: true,
      $or: [{ padre: id }, { madre: id }],
    }).collation({ locale: 'es' }).sort({ identificador: 1 })
  );
};

const getSiblings = async (id, usuario) => {
  const animal = await getActiveAnimalOrThrow(id, usuario);

  if (!animal.padre && !animal.madre) {
    return [];
  }

  const query = {
    active: true,
    _id: { $ne: animal._id },
  };

  if (animal.padre && animal.madre) {
    query.padre = animal.padre._id || animal.padre;
    query.madre = animal.madre._id || animal.madre;
  } else {
    query.$or = [];
    if (animal.padre) {
      query.$or.push({ padre: animal.padre._id || animal.padre });
    }
    if (animal.madre) {
      query.$or.push({ madre: animal.madre._id || animal.madre });
    }
  }

  return populateAnimalRelations(
    Animal.find(query).collation({ locale: 'es' }).sort({ identificador: 1 })
  );
};

const assignParents = async (id, data, usuario) => {
  const animal = await Animal.findById(id);
  if (!animal || !animal.active) {
    throw createError('Animal no encontrado', 404);
  }

  assertCanManageAnimal(animal, usuario);

  const hasPadre = Object.prototype.hasOwnProperty.call(data, 'padre');
  const hasMadre = Object.prototype.hasOwnProperty.call(data, 'madre');

  if (!hasPadre && !hasMadre) {
    throw createError('Debes enviar padre, madre o ambos');
  }

  const payload = {};

  const speciesId = animal.especie._id || animal.especie;

  if (hasPadre) {
    payload.padre = await validateExistingParent({
      animal,
      speciesId,
      parentId: data.padre,
      expectedSex: 'macho',
      label: 'padre',
    });
  }

  if (hasMadre) {
    payload.madre = await validateExistingParent({
      animal,
      speciesId,
      parentId: data.madre,
      expectedSex: 'hembra',
      label: 'madre',
    });
  }

  if (payload.padre && payload.madre && toId(payload.padre) === toId(payload.madre)) {
    throw createError('El padre y la madre no pueden ser el mismo animal');
  }

  const updated = await populateAnimalRelations(
    Animal.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  );

  return updated;
};

module.exports = {
  getTree,
  getChildren,
  getSiblings,
  assignParents,
};
