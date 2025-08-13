// middlewares/verificarApiKey.js
module.exports = function (req, res, next) {
    const apiKey = req.headers['x-api-key'];

    console.log("📩 Header recibido x-api-key:", JSON.stringify(apiKey));
    console.log("📂 Clave en process.env.MICROSERVICIO_API_KEY:", JSON.stringify(process.env.MICROSERVICIO_API_KEY));

    if (!apiKey || apiKey !== process.env.MICROSERVICIO_API_KEY) {
        console.warn("❌ Acceso no autorizado - Clave inválida o ausente");
        return res.status(401).json({ error: 'Acceso no autorizado' });
    }

    console.log("✅ API Key válida, acceso permitido");
    next();
};
