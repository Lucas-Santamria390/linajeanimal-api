const { Router } = require('express');
const { param, validationResult } = require('express-validator');
const controller = require('../controllers/usuarioController');
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
  auth,
  authorize('admin'),
  controller.list
);

router.delete('/:id',
  auth,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido').escape(),
  validarCampos,
  controller.deactivate
);

module.exports = router;
