const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = Router();

const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

router.post('/register',
  authLimiter,
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').optional().isIn(['user', 'admin']).withMessage('Rol no válido'),
  validarCampos,
  controller.register
);

router.post('/login',
  authLimiter,
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  validarCampos,
  controller.login
);

router.get('/profile',
  auth,
  controller.profile
);

module.exports = router;
