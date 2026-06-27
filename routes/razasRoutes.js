const { Router } = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/razaController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

router.get('/',
  query('especie').optional().isMongoId().withMessage('ID de especie invalido'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano'),
  validarCampos,
  controller.list
);

router.get('/:id',
  param('id').isMongoId().withMessage('ID inválido'),
  validarCampos,
  controller.getById
);

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

router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  validarCampos,
  controller.deactivate
);

module.exports = router;
