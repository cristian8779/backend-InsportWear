const Credenciales = require("../models/Credenciales");
const bcrypt = require("bcryptjs");

// Buscar credencial por email
const obtenerCredencialPorEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const credencial = await Credenciales.findOne({ email: email.trim().toLowerCase() });

    if (!credencial) {
      return res.status(404).json({ mensaje: 'Credencial no encontrada' });
    }

    res.json({ _id: credencial._id, email: credencial.email, rol: credencial.rol });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al buscar credencial', error: err.message });
  }
};

// Actualizar contraseña
const actualizarPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevaPassword } = req.body;

    const credencial = await Credenciales.findById(id);
    if (!credencial) {
      return res.status(404).json({ mensaje: 'Credencial no encontrada' });
    }

    const salt = await bcrypt.genSalt(10);
    credencial.password = await bcrypt.hash(nuevaPassword, salt);
    await credencial.save();

    res.json({ mensaje: "Contraseña actualizada con éxito" });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar contraseña', error: err.message });
  }
};

module.exports = {
  obtenerCredencialPorEmail,
  actualizarPassword
};
