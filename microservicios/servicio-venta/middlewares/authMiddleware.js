const jwt = require('jsonwebtoken');

// ✅ Verifica el token JWT y guarda el usuario en req.usuario
const verificarToken = (req, res, next) => {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No hay token.' });
  }

  const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.split(' ')[1] : tokenHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token no válido.' });
  }
};

// ✅ Permite solo a admin y superAdmin
const verificarAdmin = (req, res, next) => {
  const rol = req.usuario?.rol;

  if (rol === 'admin' || rol === 'superAdmin') {
    return next();
  }

  return res.status(403).json({ mensaje: 'Acceso denegado: requiere rol de administrador o superAdmin.' });
};

module.exports = {
  verificarToken,
  verificarAdmin
};
