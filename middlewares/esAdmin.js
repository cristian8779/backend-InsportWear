module.exports = (req, res, next) => {
    // Verificamos si el usuario tiene rol 'admin'
    if (req.usuario && req.usuario.rol === 'admin') {
      return next();  // El usuario es admin, continúa
    } else {
      return res.status(403).json({ message: 'Acceso denegado: no eres administrador' });
    }
  };
  