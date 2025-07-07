const jwt = require('jsonwebtoken');

// Verifica el token JWT y guarda el usuario en req.usuario
const verificarToken = (req, res, next) => {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ mensaje: 'Acceso denegado. No hay token.' });
  }

  const token = tokenHeader.startsWith('Bearer ')
    ? tokenHeader.split(' ')[1]
    : tokenHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adaptamos el payload para que tenga "_id" en lugar de "id"
    req.usuario = {
      _id: decoded.id,      // Esto soluciona tu problema con el modelo Favorito
      rol: decoded.rol,
      ...decoded            // Por si tenés más campos útiles
    };

    next();
  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    res.status(401).json({ mensaje: 'Token no válido o expirado.' });
  }
};

// Verifica si el usuario es administrador
const verificarAdmin = (req, res, next) => {
  console.log('🛂 Usuario en verificarAdmin:', req.usuario);

  if (req.usuario?.rol === 'admin') {
    return next();
  }

  return res.status(403).json({
    mensaje: 'Acceso denegado: no eres administrador.',
  });
};

module.exports = {
  verificarToken,
  verificarAdmin,
};
