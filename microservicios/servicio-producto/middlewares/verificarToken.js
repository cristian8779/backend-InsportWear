const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const tokenHeader = req.header('Authorization');

  if (!tokenHeader) {
    return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
  }

  const token = tokenHeader.startsWith('Bearer ')
    ? tokenHeader.split(' ')[1]
    : tokenHeader;

  try {
    const verificado = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verificado:', verificado);

    // Mapear el payload para que sea compatible con controladores Mongoose
    req.usuario = {
      _id: verificado.id,
      rol: verificado.rol,
      ...verificado
    };

    next();
  } catch (err) {
    console.error('❌ Error al verificar token:', err.message);
    res.status(401).json({ mensaje: 'Token inválido o expirado.' });
  }
};

module.exports = verificarToken;
