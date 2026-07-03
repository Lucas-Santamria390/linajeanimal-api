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
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener un número')
    .matches(/[^A-Za-z0-9]/).withMessage('Debe contener un carácter especial'),
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

router.put('/password',
  auth,
  body('currentPassword').notEmpty().withMessage('La contraseña actual es obligatoria'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener un número')
    .matches(/[^A-Za-z0-9]/).withMessage('Debe contener un carácter especial'),
  validarCampos,
  controller.changePassword
);

router.post('/logout',
  auth,
  controller.logout
);

router.get('/profile',
  auth,
  controller.profile
);

module.exports = router;
