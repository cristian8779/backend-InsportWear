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
    
    req.usuario = verificado; // ✅ Asegúrate de usar 'usuario' como en esAdmin.js
    next();
  } catch (err) {
    res.status(400).json({ mensaje: 'Token inválido' });
  }
};

module.exports = verificarToken;
