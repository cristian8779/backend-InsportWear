// middlewares/limitarInvitacionPendiente.js
const RolRequest = require("../models/RolRequest");

const limitarInvitacionPendiente = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ mensaje: "El email del usuario es obligatorio" });
    }

    // Buscar invitación pendiente para el email
    const invitacionPendiente = await RolRequest.findOne({
      email,
      estado: "pendiente",
    });

    if (invitacionPendiente) {
      return res.status(400).json({
        mensaje: "Este usuario ya tiene una invitación pendiente. Debe aceptarla, rechazarla o esperar a que expire.",
      });
    }

    // Si no hay pendiente, sigue al siguiente middleware
    next();
  } catch (error) {
    console.error("Error en limitarInvitacionPendiente:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

module.exports = limitarInvitacionPendiente;
