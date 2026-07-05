const config = require('../config/env');

// Tipos de eventos de seguridad para mantener consistencia en los logs
const EventTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  LOGOUT: 'LOGOUT',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  SELF_DEACTIVATE_BLOCKED: 'SELF_DEACTIVATE_BLOCKED',
  ERROR: 'ERROR',
};

// Extrae metadatos relevantes de la request para incluirlos en los logs
function extractReqMeta(req) {
  if (!req) return {};
  return {
    ip: req.ip || req.connection?.remoteAddress, // Dirección IP del cliente
    userAgent: req.get('User-Agent'),             // Navegador/cliente usado
    method: req.method,                           // GET, POST, etc.
    url: req.originalUrl || req.url,              // Ruta solicitada
  };
}

// Función centralizada para registrar eventos de seguridad
// En producción usa JSON (para ingestión en sistemas de logging)
// En desarrollo usa texto legible
function logSecurityEvent(eventType, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    ...data,
  };

  if (config.nodeEnv === 'production') {
    // JSON estructurado para herramientas como ELK, Datadog, etc.
    console.log(JSON.stringify(entry));
  } else {
    // Texto legible para desarrollo local
    console.log(`[SECURITY] ${eventType}${data.message ? ': ' + data.message : ''}`);
  }
}

module.exports = { logSecurityEvent, EventTypes, extractReqMeta };
