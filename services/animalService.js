const Animal = require('../models/Animal');
const Especie = require('../models/Especie');
const Raza = require('../models/Raza');
const Usuario = require('../models/Usuario');

const createError = require('../utils/createError');
const { toId, isValidId, escapeRegex, assertValidDate, parseBooleanQuery, populateAnimalRelations } = require('../utils/animalHelpers');
const { validateSpeciesAndBreed, validateExistingParent } = require('./animalValidationService');
const { assertCanManageAnimal, getActiveAnimalOrThrow } = require('./animalPermissions');

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
  if (payload.identificador !== undefined) {
    payload.identificador = String(payload.identificador).trim();
  }
  if (payload.color !== undefined) {
    payload.color = String(payload.color).trim();
  }
  if (payload.fotoUrl !== undefined) {
    payload.fotoUrl = String(payload.fotoUrl).trim();
  }
  if (payload.notas !== undefined) {
    payload.notas = String(payload.notas).trim();
  }

  return payload;
};

const list = async (query = {}, usuario) => {
  const filters = {};

  const active = parseBooleanQuery(query.active);
  filters.active = active === undefined ? true : active;

  if (usuario && usuario.rol !== 'admin') {
    filters['propietario._id'] = usuario._id;
  }

  if (query.nombre) {
    filters.nombre = { $regex: escapeRegex(String(query.nombre).trim()), $options: 'i' };
  }

  if (query.identificador) {
    filters.identificador = { $regex: escapeRegex(String(query.identificador).trim()), $options: 'i' };
  }

  if (query.especie) {
    if (!isValidId(query.especie)) {
      throw createError('La especie no es valida');
    }
    filters['especie._id'] = query.especie;
  }

  if (query.raza) {
    if (!isValidId(query.raza)) {
      throw createError('La raza no es valida');
    }
    filters['raza._id'] = query.raza;
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
    if (!usuario || usuario.rol === 'admin') {
      filters['propietario._id'] = query.propietario;
    }
  }

  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [total, animals] = await Promise.all([
    Animal.countDocuments(filters),
    populateAnimalRelations(
      Animal.find(filters)
        .collation({ locale: 'es' })
        .sort({ identificador: 1 })
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

  const propietario = await Usuario.findById(usuarioId);
  if (!propietario) {
    throw createError('Propietario no encontrado', 404);
  }

  const payload = {
    especie: { _id: especie._id, nombre: especie.nombre },
    raza: { _id: raza._id, nombre: raza.nombre },
    sexo: data.sexo,
    fechaNacimiento,
    propietario: { _id: propietario._id, nombre: propietario.nombre, email: propietario.email },
  };

  if (data.nombre !== undefined) {
    payload.nombre = String(data.nombre).trim();
  }

  if (data.peso !== undefined) {
    payload.peso = data.peso;
  }
  if (data.color !== undefined) {
    payload.color = String(data.color).trim();
  }
  payload.identificador = String(data.identificador).trim();
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

  if (payload.padre) {
    await Animal.findByIdAndUpdate(payload.padre, { $inc: { cantidadHijos: 1 } });
  }
  if (payload.madre) {
    await Animal.findByIdAndUpdate(payload.madre, { $inc: { cantidadHijos: 1 } });
  }

  await Especie.findByIdAndUpdate(especie._id, { $inc: { cantidadAnimales: 1 } });
  await Raza.findByIdAndUpdate(raza._id, { $inc: { cantidadAnimales: 1 } });

  return getById(animal._id);
};

const getById = async (id, usuario) => {
  return getActiveAnimalOrThrow(id, usuario);
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

  const oldEspecieId = animal.especie._id || animal.especie;
  const oldRazaId = animal.raza._id || animal.raza;
  const nextSpeciesId = payload.especie || oldEspecieId;
  const nextBreedId = payload.raza || oldRazaId;

  if (payload.fechaNacimiento !== undefined) {
    payload.fechaNacimiento = assertValidDate(payload.fechaNacimiento);
  }

  if (payload.sexo && payload.sexo !== animal.sexo) {
    const hasChildren = await Animal.exists({ $or: [{ padre: animal._id }, { madre: animal._id }] });
    if (hasChildren) {
      throw createError('No se puede cambiar el sexo de un animal que ya tiene hijos');
    }
  }

  const speciesChanged = payload.especie !== undefined && toId(payload.especie) !== toId(oldEspecieId);
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

    if (hasParentsOrChildren && speciesChanged) {
      throw createError('No se puede cambiar la especie de un animal que ya tiene relaciones familiares');
    }

    const { especie, raza } = await validateSpeciesAndBreed(nextSpeciesId, nextBreedId);
    payload.especie = { _id: especie._id, nombre: especie.nombre };
    payload.raza = { _id: raza._id, nombre: raza.nombre };
  }

  const updated = await populateAnimalRelations(
    Animal.findByIdAndUpdate(id, payload, { new: true, runValidators: true })
  );

  if (speciesChanged) {
    await Especie.findByIdAndUpdate(oldEspecieId, { $inc: { cantidadAnimales: -1 } });
    await Especie.findByIdAndUpdate(nextSpeciesId, { $inc: { cantidadAnimales: 1 } });
  }

  return updated;
};

const deactivate = async (id, usuario) => {
  const animal = await Animal.findById(id);
  if (!animal || !animal.active) {
    throw createError('Animal no encontrado', 404);
  }

  assertCanManageAnimal(animal, usuario);

  await Animal.findByIdAndUpdate(id, { active: false });

  const especieId = animal.especie._id || animal.especie;
  const razaId = animal.raza._id || animal.raza;
  await Especie.findByIdAndUpdate(especieId, { $inc: { cantidadAnimales: -1 } });
  await Raza.findByIdAndUpdate(razaId, { $inc: { cantidadAnimales: -1 } });

  return { ...animal.toObject(), active: false };
};

module.exports = {
  list,
  create,
  getById,
  update,
  deactivate,
};
