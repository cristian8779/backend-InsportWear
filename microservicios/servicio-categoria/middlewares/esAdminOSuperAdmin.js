// middlewares/esAdminOSuperAdmin.js
module.exports = (req, res, next) => {
  const rol = req.usuario?.rol;

  if (rol === 'admin' || rol === 'superAdmin') {
    return next();
  }

  return res.status(403).json({ mensaje: 'Acceso denegado: requiere rol de administrador o superadministrador.' });
};
