// Capa servicio: lógica de negocio de animales con genealogía y permisos por propietario
const mongoose = require('mongoose');
const Animal = require('../models/Animal');
const Especie = require('../models/Especie');
const Raza = require('../models/Raza');
const Usuario = require('../models/Usuario');

const createError = require('../utils/createError');

// Constantes del árbol genealógico
const DEFAULT_TREE_DEPTH = 3;
const MAX_TREE_DEPTH = 5;

// Utilidades internas
const toId = (value) => (value ? value.toString() : null);

const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

// Parsea query booleano desde string ("true"/"false"/"1"/"0")
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

// Parsea profundidad del árbol con límites seguro (1-5)
const parseDepth = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_TREE_DEPTH;
  }
  return Math.max(1, Math.min(parsed, MAX_TREE_DEPTH));
};

// Escapa caracteres especiales de Regex para búsquedas seguras
const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Valida que la fecha sea real y no esté en el futuro
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

// Helper: hace populate de padre y madre en consultas de Animal
const populateAnimalRelations = (query) => {
  return query
    .populate('padre', 'identificador nombre sexo especie raza fechaNacimiento active')
    .populate('madre', 'identificador nombre sexo especie raza fechaNacimiento active');
};

// Obtiene un animal activo validando permisos de lectura
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

// Verifica permisos de escritura (solo admin o propietario)
const assertCanManageAnimal = (animal, usuario) => {
  if (usuario?.rol === 'admin') {
    return;
  }

  const propietarioId = animal.propietario._id || animal.propietario;
  if (!usuario || toId(propietarioId) !== toId(usuario._id)) {
    throw createError('No tienes permisos para realizar esta accion', 403);
  }
};

// Verifica permisos de lectura (admin ve todo, user solo sus animales)
const assertCanReadAnimal = (animal, usuario) => {
  if (!usuario || usuario.rol === 'admin') {
    return;
  }

  const propietarioId = animal.propietario._id || animal.propietario;
  if (toId(propietarioId) !== toId(usuario._id)) {
    throw createError('No tienes permisos para ver este animal', 403);
  }
};

// Valida que especie y raza existan, estén activas y la raza pertenezca a la especie
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

// Valida un padre/madre candidato: mismo sexo, misma especie, sin ciclos
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

  // Previene ciclos: el padre no puede ser descendiente del animal
  if (animal) {
    const isDescendant = await isDescendantOf(animal._id, parent._id);
    if (isDescendant) {
      throw createError(`El ${label} no puede ser descendiente del animal`);
    }
  }

  return parent._id;
};

// Verifica recursivamente si targetId es descendiente de rootId (detección de ciclos)
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

// Construye recursivamente el árbol genealógico con control de profundidad y ciclos
const buildTreeNode = async (animalId, maxDepth, currentDepth = 0, visited = new Set()) => {
  if (!animalId || currentDepth > maxDepth) {
    return null;
  }

  const key = toId(animalId);
  if (visited.has(key)) {
    return null; // Evita ciclos infinitos
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

// Normaliza el payload de actualización: solo campos permitidos y limpia strings
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

// GET — lista animales con filtros combinados y paginación
const list = async (query = {}, usuario) => {
  const filters = {};

  const active = parseBooleanQuery(query.active);
  filters.active = active === undefined ? true : active;

  // Filtro de propietario: admin ve todo, user solo sus animales
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

  // Admin puede filtrar por propietario específico
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
        .collation({ locale: 'es' }) // Orden alfabético en español
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

// POST — crea animal con subdocumentos embebidos y actualiza contadores
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

  // Actualiza contadores desnormalizados
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

// GET /:id — obtiene animal por ID (hereda validaciones de getActiveAnimalOrThrow)
const getById = async (id, usuario) => {
  return getActiveAnimalOrThrow(id, usuario);
};

// PUT /:id — actualiza animal validando cambios de especie/raza y relaciones familiares
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

  // Bloquea cambio de sexo si el animal ya tiene hijos
  if (payload.sexo && payload.sexo !== animal.sexo) {
    const hasChildren = await Animal.exists({ $or: [{ padre: animal._id }, { madre: animal._id }] });
    if (hasChildren) {
      throw createError('No se puede cambiar el sexo de un animal que ya tiene hijos');
    }
  }

  const speciesChanged = payload.especie !== undefined && toId(payload.especie) !== toId(oldEspecieId);
  const needsFamilyValidation = payload.especie !== undefined || payload.raza !== undefined;

  // Si cambia especie/raza, valida que el animal no tenga relaciones familiares
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

  // Actualiza contadores de especie si cambió
  if (speciesChanged) {
    await Especie.findByIdAndUpdate(oldEspecieId, { $inc: { cantidadAnimales: -1 } });
    await Especie.findByIdAndUpdate(nextSpeciesId, { $inc: { cantidadAnimales: 1 } });
  }

  return updated;
};

// DELETE /:id — soft delete: descuenta contadores en especie y raza
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

// GET /:id/family-tree — árbol genealógico con profundidad configurable
const getTree = async (id, generations = DEFAULT_TREE_DEPTH, usuario) => {
  const maxDepth = parseDepth(generations);
  const animal = await getActiveAnimalOrThrow(id, usuario);
  const tree = await buildTreeNode(animal._id, maxDepth);
  return {
    generaciones: maxDepth,
    arbol: tree,
  };
};

// GET /:id/children — hijos directos del animal
const getChildren = async (id, usuario) => {
  await getActiveAnimalOrThrow(id, usuario);

  return populateAnimalRelations(
    Animal.find({
      active: true,
      $or: [{ padre: id }, { madre: id }],
    }).collation({ locale: 'es' }).sort({ identificador: 1 })
  );
};

// GET /:id/siblings — hermanos (mismo padre Y madre, o al menos uno en común)
const getSiblings = async (id, usuario) => {
  const animal = await getActiveAnimalOrThrow(id, usuario);

  if (!animal.padre && !animal.madre) {
    return [];
  }

  const query = {
    active: true,
    _id: { $ne: animal._id }, // Excluirse a sí mismo
  };

  // Si tiene ambos padres, busca hermanos completos (mismo padre y madre)
  if (animal.padre && animal.madre) {
    query.padre = animal.padre._id || animal.padre;
    query.madre = animal.madre._id || animal.madre;
  } else {
    // Si solo tiene un padre, busca medios hermanos
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

// POST /:id/parents — asigna o reemplaza padre/madre con validaciones
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
  list,
  create,
  getById,
  update,
  deactivate,
  getTree,
  getChildren,
  getSiblings,
  assignParents,
};
