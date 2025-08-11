// /middlewares/verificarApiKey.js
// middlewares/validarApiKey.js
module.exports = function (req, res, next) {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.MICROSERVICIO_API_KEY) {
        return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    next();
};
