const { Router } = require('express');
const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const controller = require('../controllers/animalController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

const mongoIdOptional = (field, message) => {
  return body(field)
    .optional({ nullable: true })
    .custom((value) => value === null || mongoose.Types.ObjectId.isValid(value))
    .withMessage(message);
};

const createValidators = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('especie').isMongoId().withMessage('La especie debe ser un ID valido'),
  body('raza').isMongoId().withMessage('La raza debe ser un ID valido'),
  body('sexo').isIn(['macho', 'hembra']).withMessage('El sexo debe ser macho o hembra'),
  body('fechaNacimiento').isISO8601().withMessage('La fecha de nacimiento no es valida').toDate(),
  body('peso').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El peso debe ser un numero valido y positivo').toFloat(),
  body('color').optional({ nullable: true }).trim().escape(),
  body('identificador').optional({ nullable: true }).trim().escape(),
  body('fotoUrl').optional({ nullable: true }).isURL().withMessage('La fotoUrl debe ser una URL valida'),
  body('notas').optional({ nullable: true }).trim().escape(),
  mongoIdOptional('padre', 'El padre debe ser un ID valido'),
  mongoIdOptional('madre', 'La madre debe ser un ID valido'),
];

const updateValidators = [
  body('nombre').optional({ nullable: true }).trim().notEmpty().withMessage('El nombre no puede estar vacio').escape(),
  body('especie').optional({ nullable: true }).isMongoId().withMessage('La especie debe ser un ID valido'),
  body('raza').optional({ nullable: true }).isMongoId().withMessage('La raza debe ser un ID valido'),
  body('sexo').optional({ nullable: true }).isIn(['macho', 'hembra']).withMessage('El sexo debe ser macho o hembra'),
  body('fechaNacimiento').optional({ nullable: true }).isISO8601().withMessage('La fecha de nacimiento no es valida').toDate(),
  body('peso').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El peso debe ser un numero valido y positivo').toFloat(),
  body('color').optional({ nullable: true }).trim().escape(),
  body('identificador').optional({ nullable: true }).trim().escape(),
  body('fotoUrl').optional({ nullable: true }).isURL().withMessage('La fotoUrl debe ser una URL valida'),
  body('notas').optional({ nullable: true }).trim().escape(),
];

const parentValidators = [
  mongoIdOptional('padre', 'El padre debe ser un ID valido'),
  mongoIdOptional('madre', 'La madre debe ser un ID valido'),
];

const atLeastOneParent = (req, res, next) => {
  const hasPadre = Object.prototype.hasOwnProperty.call(req.body, 'padre');
  const hasMadre = Object.prototype.hasOwnProperty.call(req.body, 'madre');

  if (!hasPadre && !hasMadre) {
    return res.status(400).json({ success: false, message: 'Debes enviar padre, madre o ambos' });
  }

  next();
};

router.get('/',
  auth,
  query('especie').optional().isMongoId().withMessage('Especie invalida'),
  query('raza').optional().isMongoId().withMessage('Raza invalida'),
  query('propietario').optional().isMongoId().withMessage('Propietario invalido'),
  query('sexo').optional().isIn(['macho', 'hembra']).withMessage('Sexo invalido'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano'),
  validarCampos,
  controller.list
);

router.get('/:id',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.getById
);

router.post('/',
  auth,
  ...createValidators,
  validarCampos,
  controller.create
);

router.put('/:id',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  ...updateValidators,
  validarCampos,
  controller.update
);

router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.remove
);

router.get('/:id/arbol-genealogico',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.tree
);

router.get('/:id/hijos',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.children
);

router.get('/:id/hermanos',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  validarCampos,
  controller.siblings
);

router.post('/:id/padres',
  auth,
  param('id').isMongoId().withMessage('ID invalido'),
  ...parentValidators,
  atLeastOneParent,
  validarCampos,
  controller.assignParents
);

module.exports = router;
