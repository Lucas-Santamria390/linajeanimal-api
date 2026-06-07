const { Router } = require('express');
const { body, param, query, validationResult } = require('express-validator');
const controller = require('../controllers/razaController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/role');

const router = Router();

const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

router.get('/',
  query('especie').optional().isMongoId().withMessage('ID de especie inválido'),
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
  controller.remove
);

module.exports = router;
