// Importa express-rate-limit para limitar peticiones por IP
const rateLimit = require('express-rate-limit');

// Limitador específico para rutas de autenticación (login/register)
// Previene ataques de fuerza bruta en endpoints sensibles
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  // En desarrollo/test permite muchos requests; en producción solo 10
  max: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 10000 : 10,
  message: { success: false, message: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
  standardHeaders: true,  // Envía headers RateLimit-* estándar
  legacyHeaders: false,   // No usa headers X-RateLimit-* (deprecados)
});

// Limitador general para el resto de rutas de la API
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,    // Ventana de 1 minuto
  // En desarrollo/test permite muchos requests; en producción solo 100
  max: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? 100000 : 100,
  message: { success: false, message: 'Demasiadas solicitudes, intente de nuevo en un minuto' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
