const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validarCampos = require('../middleware/validarCampos');

const router = Router();

router.post('/register',
  authLimiter,
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
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
