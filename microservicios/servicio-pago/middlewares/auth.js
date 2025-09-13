// middlewares/auth.js
const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ mensaje: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // 👈 aquí queda el userId
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: "Token inválido" });
  }
};
