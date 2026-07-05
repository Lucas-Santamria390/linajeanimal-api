// Rutas de animales CRUD + genealogía (todas requieren autenticación)
const { Router } = require('express');
const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const controller = require('../controllers/animalController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

// Helper: valida MongoId opcional (acepta null para eliminar la referencia)
const mongoIdOptional = (field, message) => {
  return body(field)
    .optional({ nullable: true })
    .custom((value) => value === null || mongoose.Types.ObjectId.isValid(value))
    .withMessage(message);
};

// Validaciones para creación de animal
const createValidators = [
  body('nombre').optional({ nullable: true }).trim().notEmpty().withMessage('El nombre no puede estar vacio').escape(),
  body('especie').isMongoId().withMessage('La especie debe ser un ID valido'),
  body('raza').isMongoId().withMessage('La raza debe ser un ID valido'),
  body('sexo').isIn(['macho', 'hembra']).withMessage('El sexo debe ser macho o hembra'),
  body('fechaNacimiento').isISO8601().withMessage('La fecha de nacimiento no es valida').toDate()
    .custom((value) => {
      if (value > new Date()) throw new Error('La fecha de nacimiento no puede ser futura');
      return true;
    }),
  body('peso').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El peso debe ser un numero valido y positivo').toFloat(),
  body('color').optional({ nullable: true }).trim().escape(),
  body('identificador').trim().notEmpty().withMessage('El identificador es obligatorio').escape(),
  body('fotoUrl').optional({ nullable: true }).isURL().withMessage('La fotoUrl debe ser una URL valida'),
  body('notas').optional({ nullable: true }).trim().escape(),
  mongoIdOptional('padre', 'El padre debe ser un ID valido'),
  mongoIdOptional('madre', 'La madre debe ser un ID valido'),
];

// Validaciones para actualización de animal (todos los campos opcionales)
const updateValidators = [
  body('nombre').optional({ nullable: true }).trim().notEmpty().withMessage('El nombre no puede estar vacio').escape(),
  body('especie').optional({ nullable: true }).isMongoId().withMessage('La especie debe ser un ID valido'),
  body('raza').optional({ nullable: true }).isMongoId().withMessage('La raza debe ser un ID valido'),
  body('sexo').optional({ nullable: true }).isIn(['macho', 'hembra']).withMessage('El sexo debe ser macho o hembra'),
  body('fechaNacimiento').optional({ nullable: true }).isISO8601().withMessage('La fecha de nacimiento no es valida').toDate()
    .custom((value) => {
      if (value > new Date()) throw new Error('La fecha de nacimiento no puede ser futura');
      return true;
    }),
  body('peso').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El peso debe ser un numero valido y positivo').toFloat(),
  body('color').optional({ nullable: true }).trim().escape(),
  body('identificador').optional({ nullable: true }).trim().escape(),
  body('fotoUrl').optional({ nullable: true }).isURL().withMessage('La fotoUrl debe ser una URL valida'),
  body('notas').optional({ nullable: true }).trim().escape(),
];

// Validaciones para asignar padres (ambos opcionales, pero al menos uno requerido)
const parentValidators = [
  mongoIdOptional('padre', 'El padre debe ser un ID valido'),
  mongoIdOptional('madre', 'La madre debe ser un ID valido'),
];

// Middleware inline: verifica que se envíe padre, madre o ambos
const atLeastOneParent = (req, res, next) => {
  const hasPadre = Object.prototype.hasOwnProperty.call(req.body, 'padre');
  const hasMadre = Object.prototype.hasOwnProperty.call(req.body, 'madre');

  if (!hasPadre && !hasMadre) {
    return res.status(400).json({ success: false, message: 'Debes enviar padre, madre o ambos' });
  }

  next();
};

// GET / — lista animales con filtros y paginación
router.get('/',
  auth,
  query('especie').optional().isMongoId().withMessage('Especie invalida'),
  query('raza').optional().isMongoId().withMessage('Raza invalida'),
  query('propietario').optional().isMongoId().withMessage('Propietario invalido'),
  query('sexo').optional().isIn(['macho', 'hembra']).withMessage('Sexo invalido'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano'),
  query('nombre').optional().trim().escape(),
  query('identificador').optional().trim().escape(),
  validarCampos,
  controller.list
);

// GET /:id — detalle de animal
router.get('/:id',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.getById
);

// POST / — crea animal
router.post('/',
  auth,
  ...createValidators,
  validarCampos,
  controller.create
);

// PUT /:id — actualiza animal
router.put('/:id',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  ...updateValidators,
  validarCampos,
  controller.update
);

// DELETE /:id — soft delete (solo admin)
router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.deactivate
);

// GET /:id/family-tree — árbol genealógico (opcional ?generaciones=)
router.get('/:id/family-tree',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.tree
);

// GET /:id/children — hijos directos
router.get('/:id/children',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.children
);

// GET /:id/siblings — hermanos
router.get('/:id/siblings',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.siblings
);

// POST /:id/parents — asigna padre/madre
router.post('/:id/parents',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  ...parentValidators,
  atLeastOneParent,
  validarCampos,
  controller.assignParents
);

module.exports = router;
