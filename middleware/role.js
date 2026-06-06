const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      const err = new Error('No tienes permisos para realizar esta acción');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
};

module.exports = authorize;
