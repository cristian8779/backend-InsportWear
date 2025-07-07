// /middlewares/verificarApiKey.js
module.exports = function (req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.MICROSERVICIO_API_KEY) {
    return res.status(403).json({ mensaje: 'Acceso denegado: API Key inválida.' });
  }
  next();
};
