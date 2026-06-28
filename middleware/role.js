const { logSecurityEvent, EventTypes, extractReqMeta } = require('./securityLogger');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      logSecurityEvent(EventTypes.ACCESS_DENIED, {
        ...extractReqMeta(req),
        userId: req.usuario._id,
        userEmail: req.usuario.email,
        userRol: req.usuario.rol,
        requiredRoles: roles,
        message: `Usuario rol ${req.usuario.rol} intento acceder a ruta que requiere ${roles.join(', ')}`,
      });
      const err = new Error('No tienes permisos para realizar esta acción');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
};

module.exports = authorize;
