// middlewares/verificarToken.js
const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  console.log("🔐 [verificarToken] Iniciando verificación de token");
  console.log("🔐 [verificarToken] Headers recibidos:", req.headers);
  
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization;
    console.log("🔐 [verificarToken] Authorization header:", authHeader);
    
    if (!authHeader) {
      console.warn("⚠️ [verificarToken] No se encontró header Authorization");
      return res.status(401).json({ 
        mensaje: "Token no proporcionado. Incluye Authorization: Bearer <token>" 
      });
    }

    // Verificar formato "Bearer <token>"
    if (!authHeader.startsWith("Bearer ")) {
      console.warn("⚠️ [verificarToken] Formato de token inválido");
      return res.status(401).json({ 
        mensaje: "Formato de token inválido. Usa: Bearer <token>" 
      });
    }

    // Extraer el token
    const token = authHeader.split(" ")[1];
    console.log("🔐 [verificarToken] Token extraído:", token ? `${token.substring(0, 20)}...` : "null");
    
    if (!token) {
      console.warn("⚠️ [verificarToken] Token vacío después de extraer");
      return res.status(401).json({ mensaje: "Token vacío" });
    }

    // Verificar JWT_SECRET
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("❌ [verificarToken] JWT_SECRET no está definido en .env");
      return res.status(500).json({ mensaje: "Error de configuración del servidor" });
    }

    // Decodificar y verificar el token
    console.log("🔐 [verificarToken] Decodificando token...");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("✅ [verificarToken] Token decodificado exitosamente:", {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      iat: decoded.iat,
      exp: decoded.exp
    });

    // Agregar usuario al request
    req.usuario = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol,
      nombre: decoded.nombre || null
    };

    console.log("✅ [verificarToken] req.usuario establecido:", req.usuario);
    next();

  } catch (error) {
    console.error("❌ [verificarToken] Error al verificar token:", error.message);
    
    // Manejar diferentes tipos de errores JWT
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