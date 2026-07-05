// Rutas CRUD de especies (GET público, POST/PUT/DELETE solo admin)
const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/especieController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

// GET / — lista especies (público)
router.get('/', controller.list);

// GET /:id — detalle de especie (público)
router.get('/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validarCampos,
  controller.getById
);

// POST / — crea especie (solo admin)
router.post('/',
  auth,
  authorize('admin'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
    .escape(),
  body('descripcion').optional().trim().escape(),
  validarCampos,
  controller.create
);

// PUT /:id — actualiza especie (solo admin)
router.put('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío')
    .escape(),
  body('descripcion').optional().trim().escape(),
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

module.exports = router;
