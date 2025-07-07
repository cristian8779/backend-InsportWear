const jwt = require('jsonwebtoken');

// Verifica el token JWT y guarda el usuario en req.usuario
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

// Verifica si el usuario es administrador
const verificarAdmin = (req, res, next) => {
  console.log('Usuario en verificarAdmin:', req.usuario); // 👈 útil para depurar

  if (req.usuario && req.usuario.rol === 'admin') {
    return next();
  } else {
    return res.status(403).json({ mensaje: 'Acceso denegado: no eres administrador' });
  }
};

module.exports = {
  verificarToken,
  verificarAdmin
};
