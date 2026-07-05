// Rutas de autenticación (públicas: register, login; protegidas: password, logout, profile)
const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter'); // Rate limit estricto
const validarCampos = require('../middleware/validarCampos');

const router = Router();

// POST /register — crea cuenta (rate limit 10 intentos/15min)
router.post('/register',
  authLimiter,
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  // Validación de seguridad: mínimo 8 chars, 1 mayúscula, 1 número, 1 especial
  body('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener un número')
    .matches(/[^A-Za-z0-9]/).withMessage('Debe contener un carácter especial'),
  validarCampos,
  controller.register
);

// POST /login — inicia sesión (rate limit 10 intentos/15min)
router.post('/login',
  authLimiter,
  body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  validarCampos,
  controller.login
);

// PUT /password — cambia contraseña (requiere autenticación)
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

// POST /logout — cierra sesión (incrementa tokenVersion)
router.post('/logout',
  auth,
  controller.logout
);

// GET /profile — obtiene datos del usuario autenticado
router.get('/profile',
  auth,
  controller.profile
);

module.exports = router;
