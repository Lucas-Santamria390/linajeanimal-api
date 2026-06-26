const mongoose = require('mongoose');
const Animal = require('../models/Animal');
const Especie = require('../models/Especie');
const Raza = require('../models/Raza');

const createError = require('../utils/createError');

const DEFAULT_TREE_DEPTH = 3;
const MAX_TREE_DEPTH = 5;

const toId = (value) => (value ? value.toString() : null);

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseBooleanQuery = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  return undefined;
};

const parseDepth = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_TREE_DEPTH;
  }
  return Math.max(1, Math.min(parsed, MAX_TREE_DEPTH));
};

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const assertValidDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createError('La fecha de nacimiento no es valida');
  }

  if (date > new Date()) {
    throw createError('La fecha de nacimiento no puede ser futura');
  }

  return date;
};

const populateAnimalRelations = (query) => {
  return query
    .populate('especie', 'nombre descripcion active')
    .populate('raza', 'nombre descripcion active especie')
    .populate('padre', 'nombre sexo especie raza fechaNacimiento active')
    .populate('madre', 'nombre sexo especie raza fechaNacimiento active')
    .populate('propietario', 'nombre email rol active');
};

const getActiveAnimalOrThrow = async (id) => {
  if (!isValidId(id)) {
    throw createError('ID invalido', 400);
  }

  const animal = await populateAnimalRelations(Animal.findById(id));
  if (!animal || !animal.active) {
    throw createError('Animal no encontrado', 404);
  }

  return animal;
};

const assertCanManageAnimal = (animal, usuario) => {
  if (usuario?.rol === 'admin') {
    return;
  }

  if (!usuario || toId(animal.propietario) !== toId(usuario._id)) {
    throw createError('No tienes permisos para realizar esta accion', 403);
  }
};

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

  if (speciesId && toId(parent.especie) !== toId(speciesId)) {
    throw createError(`El ${label} debe pertenecer a la misma especie`);
  }

  if (animal) {
    const isDescendant = await isDescendantOf(animal._id, parent._id);
    if (isDescendant) {
      throw createError(`El ${label} no puede ser descendiente del animal`);
    }
  }

  return parent._id;
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
    .populate('especie', 'nombre descripcion active')
    .populate('raza', 'nombre descripcion active especie')
    .populate('propietario', 'nombre email rol active')
    .populate('padre', 'nombre sexo especie raza fechaNacimiento active')
    .populate('madre', 'nombre sexo especie raza fechaNacimiento active');

  if (!animal) {
    return null;
  }

  return {
    _id: animal._id,
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

const normalizeUpdatePayload = (data) => {
  const payload = {};
  const allowedFields = ['nombre', 'especie', 'raza', 'sexo', 'fechaNacimiento', 'peso', 'color', 'identificador', 'fotoUrl', 'notas'];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      payload[field] = data[field];
    }
  }

  if (payload.nombre !== undefined) {
    payload.nombre = String(payload.nombre).trim();
  }
  if (payload.color !== undefined) {
    payload.color = String(payload.color).trim();
  }
  if (payload.identificador !== undefined) {
    payload.identificador = String(payload.identificador).trim();
  }
  if (payload.fotoUrl !== undefined) {
    payload.fotoUrl = String(payload.fotoUrl).trim();
  }
  if (payload.notas !== undefined) {
    payload.notas = String(payload.notas).trim();
  }

  return payload;
};

const list = async (query = {}) => {
  const filters = {};

  const active = parseBooleanQuery(query.active);
  filters.active = active === undefined ? true : active;

  if (query.nombre) {
    filters.nombre = { $regex: escapeRegex(String(query.nombre).trim()), $options: 'i' };
  }

  if (query.especie) {
    if (!isValidId(query.especie)) {
      throw createError('La especie no es valida');
    }
    filters.especie = query.especie;
  }

  if (query.raza) {
    if (!isValidId(query.raza)) {
      throw createError('La raza no es valida');
    }
    filters.raza = query.raza;
  }

  if (query.sexo) {
    if (!['macho', 'hembra'].includes(query.sexo)) {
      throw createError('El sexo no es valido');
    }
    filters.sexo = query.sexo;
  }

  if (query.propietario) {
    if (!isValidId(query.propietario)) {
      throw createError('El propietario no es valido');
    }
    filters.propietario = query.propietario;
  }

  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [total, animals] = await Promise.all([
    Animal.countDocuments(filters),
    populateAnimalRelations(
      Animal.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ),
  ]);

  return {
    data: animals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
  };
};

const create = async (data, usuarioId) => {
  const fechaNacimiento = assertValidDate(data.fechaNacimiento);
  const { especie, raza } = await validateSpeciesAndBreed(data.especie, data.raza);

  const payload = {
    nombre: String(data.nombre).trim(),
    especie: especie._id,
    raza: raza._id,
    sexo: data.sexo,
    fechaNacimiento,
    propietario: usuarioId,
  };

  if (data.peso !== undefined) {
    payload.peso = data.peso;
  }
  if (data.color !== undefined) {
    payload.color = String(data.color).trim();
  }
  if (data.identificador !== undefined) {
    payload.identificador = String(data.identificador).trim();
  }
  if (data.fotoUrl !== undefined) {
    payload.fotoUrl = String(data.fotoUrl).trim();
  }
  if (data.notas !== undefined) {
    payload.notas = String(data.notas).trim();
  }

  payload.padre = await validateExistingParent({
    speciesId: especie._id,
    parentId: data.padre,
    expectedSex: 'macho',
    label: 'padre',
  });

  payload.madre = await validateExistingParent({
    speciesId: especie._id,
    parentId: data.madre,
    expectedSex: 'hembra',
    label: 'madre',
  });

  if (payload.padre && payload.madre && toId(payload.padre) === toId(payload.madre)) {
    throw createError('El padre y la madre no pueden ser el mismo animal');
  }

  const animal = await Animal.create(payload);
  return getById(animal._id);
};

const getById = async (id) => {
  return getActiveAnimalOrThrow(id);
};

const update = async (id, data, usuario) => {
  const animal = await Animal.findById(id);
  if (!animal || !animal.active) {
    throw createError('Animal no encontrado', 404);
  }

  assertCanManageAnimal(animal, usuario);

  const payload = normalizeUpdatePayload(data);
  if (!Object.keys(payload).length) {
    throw createError('No se enviaron campos para actualizar');
  }

  const nextSpeciesId = payload.especie || animal.especie;
  const nextBreedId = payload.raza || animal.raza;

  if (payload.fechaNacimiento !== undefined) {
    payload.fechaNacimiento = assertValidDate(payload.fechaNacimiento);
  }

  if (payload.sexo && payload.sexo !== animal.sexo) {
    const hasChildren = await Animal.exists({ $or: [{ padre: animal._id }, { madre: animal._id }] });
    if (hasChildren) {
      throw createError('No se puede cambiar el sexo de un animal que ya tiene hijos');
    }
  }

  const needsFamilyValidation = payload.especie !== undefined || payload.raza !== undefined;
  if (needsFamilyValidation) {
    const hasParentsOrChildren = await Animal.exists({
      $or: [
        { padre: animal._id },
        { madre: animal._id },
        { _id: animal.padre },
        { _id: animal.madre },
      ],
    });

    if (hasParentsOrChildren && toId(nextSpeciesId) !== toId(animal.especie)) {
      throw createError('No se puede cambiar la especie de un animal que ya tiene relaciones familiares');
    }

    const { especie, raza } = await validateSpeciesAndBreed(nextSpeciesId, nextBreedId);
    payload.especie = especie._id;
    payload.raza = raza._id;
  }

  const updated = await populateAnimalRelations(
    Animal.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  );

  return updated;
};

const remove = async (id, usuario) => {
  const animal = await Animal.findById(id);
  if (!animal || !animal.active) {
    throw createError('Animal no encontrado', 404);
  }

  assertCanManageAnimal(animal, usuario);

  const removed = await populateAnimalRelations(
    Animal.findByIdAndUpdate(id, { active: false }, { new: true })
  );

  return removed;
};

const getTree = async (id, generations = DEFAULT_TREE_DEPTH) => {
  const maxDepth = parseDepth(generations);
  const animal = await getActiveAnimalOrThrow(id);
  const tree = await buildTreeNode(animal._id, maxDepth);
  return {
    generaciones: maxDepth,
    arbol: tree,
  };
};

const getChildren = async (id) => {
  await getActiveAnimalOrThrow(id);

  return populateAnimalRelations(
    Animal.find({
      active: true,
      $or: [{ padre: id }, { madre: id }],
    }).sort({ nombre: 1 })
  );
};

const getSiblings = async (id) => {
  const animal = await getActiveAnimalOrThrow(id);

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
    Animal.find(query).sort({ nombre: 1 })
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

  if (hasPadre) {
    payload.padre = await validateExistingParent({
      animal,
      speciesId: animal.especie,
      parentId: data.padre,
      expectedSex: 'macho',
      label: 'padre',
    });
  }

  if (hasMadre) {
    payload.madre = await validateExistingParent({
      animal,
      speciesId: animal.especie,
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
  list,
  create,
  getById,
  update,
  remove,
  getTree,
  getChildren,
  getSiblings,
  assignParents,
};
