const jwt = require('jsonwebtoken');

// ✅ Verifica el token y agrega el usuario al request
const verificarToken = (req, res, next) => {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No hay token.' });
  }

  const token = tokenHeader.replace('Bearer ', '');

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verificado; // Aquí se guarda todo el payload (id, rol, etc.)
    next();
  } catch (err) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};

// ✅ Permitir solo admin o superAdmin
const verificarAdmin = (req, res, next) => {
  const rol = req.usuario?.rol;

  if (rol === 'admin' || rol === 'superAdmin') {
    return next();
  }

  return res.status(403).json({ mensaje: 'Acceso denegado: requiere rol admin o superAdmin.' });
};

// 🛡️ (Opcional) Verificar solo superAdmin si más adelante lo necesitas
const verificarSuperAdmin = (req, res, next) => {
  if (req.usuario?.rol === 'superAdmin') {
    return next();
  }

  return res.status(403).json({ mensaje: 'Solo el superAdmin puede realizar esta acción.' });
};

module.exports = {
  verificarToken,
  verificarAdmin,
  verificarSuperAdmin, // <-- úsalo solo si lo necesitas
};
