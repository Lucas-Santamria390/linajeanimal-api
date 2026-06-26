const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/usuarioController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

router.get('/',
  auth,
  authorize('admin'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100').toInt(),
  validarCampos,
  controller.list
);

router.get('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  validarCampos,
  controller.getById
);

router.post('/',
  auth,
  authorize('admin'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').optional().isIn(['admin', 'user']).withMessage('Rol no válido'),
  validarCampos,
  controller.create
);

router.put('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío').escape(),
  body('email').optional().isEmail().withMessage('Email no válido').normalizeEmail(),
  body('rol').optional().isIn(['admin', 'user']).withMessage('Rol no válido'),
  validarCampos,
  controller.update
);

router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  validarCampos,
  controller.deactivate
);

router.patch('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  body('active').isBoolean().withMessage('active debe ser un valor booleano').toBoolean(),
  validarCampos,
  controller.setActive
);

module.exports = router;
