const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/especieController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

router.get('/', controller.list);

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
  validarCampos,
  controller.update
);

router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  validarCampos,
  controller.remove
);

module.exports = router;
