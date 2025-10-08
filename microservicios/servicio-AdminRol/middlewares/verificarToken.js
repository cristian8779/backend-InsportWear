// middlewares/verificarToken.js
const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ 
        mensaje: "Token no proporcionado. Incluye Authorization: Bearer <token>" 
      });
    }

    // Verificar formato "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        mensaje: "Formato de token inválido. Usa: Bearer <token>" 
      });
    }

    // Extraer el token
    const token = authHeader.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ mensaje: "Token vacío" });
    }

    // Verificar JWT_SECRET
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      return res.status(500).json({ mensaje: "Error de configuración del servidor" });
    }

    // Decodificar y verificar el token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Agregar usuario al request
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      nombre: decoded.nombre || null
    };

    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ mensaje: "Token expirado" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ mensaje: "Token inválido" });
    } else if (error.name === "NotBeforeError") {
      return res.status(401).json({ mensaje: "Token no válido aún" });
    } else {
      return res.status(401).json({ mensaje: "Error de autenticación" });
    }
  }
};

module.exports = verificarToken;
