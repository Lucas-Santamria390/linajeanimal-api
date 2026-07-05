// Rutas CRUD de usuarios (solo admin, excepto auth)
const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/usuarioController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

// GET / — lista usuarios con paginación (?page=1&limit=20) y filtro ?active= (solo admin)
router.get('/',
  auth,
  authorize('admin'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page debe ser un entero positivo').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100').toInt(),
  validarCampos,
  controller.list
);

// GET /:id — detalle de usuario (solo admin)
router.get('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  validarCampos,
  controller.getById
);

// POST / — crea usuario con validación de contraseña fuerte (solo admin)
router.post('/',
  auth,
  authorize('admin'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener un número')
    .matches(/[^A-Za-z0-9]/).withMessage('Debe contener un carácter especial'),
  body('rol').optional().isIn(['admin', 'user']).withMessage('Rol no válido'),
  validarCampos,
  controller.create
);

// PUT /:id — actualiza usuario (nombre, email, rol) (solo admin)
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

// DELETE /:id — soft delete (marca active: false) (solo admin)
router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  validarCampos,
  controller.deactivate
);

// PATCH /:id — activa/desactiva usuario (cambia active: true/false) (solo admin)
router.patch('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  body('active').isBoolean().withMessage('active debe ser un valor booleano').toBoolean(),
  validarCampos,
  controller.setActive
);

module.exports = router;
