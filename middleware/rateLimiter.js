const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 100, 
  message: { success: false, message: 'Demasiadas solicitudes, intente de nuevo en un minuto' },
  standardHeaders: true,
  legacyHeaders: false,
});
module.exports = { authLimiter, generalLimiter };
