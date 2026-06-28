const config = require('../config/env');

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

function extractReqMeta(req) {
  if (!req) return {};
  return {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    url: req.originalUrl || req.url,
  };
}

function logSecurityEvent(eventType, data = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    event: eventType,
    ...data,
  };

  if (config.nodeEnv === 'production') {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[SECURITY] ${eventType}${data.message ? ': ' + data.message : ''}`);
  }
}

module.exports = { logSecurityEvent, EventTypes, extractReqMeta };
