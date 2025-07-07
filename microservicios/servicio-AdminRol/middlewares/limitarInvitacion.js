const rateLimit = require("express-rate-limit");

const limitarInvitacion = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 solicitudes por IP cada 5 minutos
  message: {
    mensaje: "Demasiadas invitaciones enviadas. Intenta nuevamente en unos minutos.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limitarInvitacion;
