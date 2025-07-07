const esSuperAdmin = (req, res, next) => {
  if (req.usuario?.rol !== "superAdmin" && req.usuario?.rol !== "root") {
    return res.status(403).json({ mensaje: "Acceso denegado. Requiere rol superAdmin." });
  }
  next();
};

module.exports = esSuperAdmin;
