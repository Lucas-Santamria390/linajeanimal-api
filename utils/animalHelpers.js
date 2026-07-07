const mongoose = require('mongoose');

const createError = require('./createError');

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
    return 3;
  }
  return Math.max(1, Math.min(parsed, 5));
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
    .populate('padre', 'identificador nombre sexo especie raza fechaNacimiento active')
    .populate('madre', 'identificador nombre sexo especie raza fechaNacimiento active');
};

module.exports = {
  toId,
  isValidId,
  parseBooleanQuery,
  parseDepth,
  escapeRegex,
  assertValidDate,
  populateAnimalRelations,
};
