const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const tokenSinBearer = token.replace('Bearer ', '');
    const verificado = jwt.verify(tokenSinBearer, process.env.JWT_SECRET);

    console.log('Token verificado:', verificado);

    // ✅ Estándar: req.user, con _id y rol definidos
    req.user = {
      _id: verificado.id,
      rol: verificado.rol
    };

    next();
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};

module.exports = verificarToken;
