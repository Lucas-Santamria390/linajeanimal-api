// Rutas CRUD de razas (GET público, POST/PUT/DELETE solo admin)
const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/razaController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

// GET / — lista razas, opcionalmente filtradas por ?especie= (público)
router.get('/',
  query('especie').optional().isMongoId().withMessage('ID de especie invalido'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano').toBoolean(),
  validarCampos,
  controller.list
);

// GET /:id — detalle de raza (público)
router.get('/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validarCampos,
  controller.getById
);

// POST / — crea raza vinculada a especie (solo admin)
router.post('/',
  auth,
  authorize('admin'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
    .escape(),
  body('descripcion').optional().trim().escape(),
  body('especie').isMongoId().withMessage('ID de especie inválido'),
  validarCampos,
  controller.create
);

// PUT /:id — actualiza raza (solo admin)
router.put('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío')
    .escape(),
  body('descripcion').optional().trim().escape(),
  body('especie').optional().isMongoId().withMessage('ID de especie inválido'),
  validarCampos,
  controller.update
);

// DELETE /:id — soft delete (solo admin)
router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  validarCampos,
  controller.deactivate
);

// PATCH /:id — activa/desactiva raza (solo admin)
router.patch('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  body('active').isBoolean().withMessage('active debe ser un valor booleano').toBoolean(),
  validarCampos,
  controller.setActive
);

module.exports = router;
