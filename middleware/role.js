const { logSecurityEvent, EventTypes, extractReqMeta } = require('./securityLogger');

// Middleware de autorización por roles (debe usarse DESPUÉS del middleware auth)
// Recibe los roles permitidos como argumentos: authorize('admin') o authorize('admin', 'user')
const authorize = (...roles) => {
  return (req, res, next) => {
    // Verifica si el rol del usuario está entre los permitidos
    if (!roles.includes(req.usuario.rol)) {
      // Logea el intento de acceso no autorizado
      logSecurityEvent(EventTypes.ACCESS_DENIED, {
        ...extractReqMeta(req),
        userId: req.usuario._id,
        userEmail: req.usuario.email,
        userRol: req.usuario.rol,
        requiredRoles: roles,
        message: `Usuario rol ${req.usuario.rol} intento acceder a ruta que requiere ${roles.join(', ')}`,
      });
      const err = new Error('No tienes permisos para realizar esta acción');
      err.statusCode = 403; // 403 Forbidden
      return next(err);
    }
    // Si tiene el rol, continúa al siguiente middleware
    next();
  };
};

module.exports = authorize;
