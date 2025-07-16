const Credenciales = require("../models/Credenciales");

// 🔍 Obtener usuario por email (para microservicio de cambio de rol)
const obtenerUsuarioPorEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const usuario = await Credenciales.findOne({ email: email.trim().toLowerCase() }).select("email rol"); 
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado con ese correo." });
    }

    res.json({ usuario });
  } catch (error) {
    console.error("❌ Error al buscar usuario por email:", error.message);
    res.status(500).json({ mensaje: "Error al buscar el usuario.", error: error.message });
  }
};

module.exports = {
  obtenerUsuarioPorEmail,
};
