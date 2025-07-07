const Credenciales = require("../models/Credenciales");

// 🔐 Solo uso interno por otros microservicios

const listarAdminsInterno = async (req, res) => {
  try {
    const admins = await Credenciales.find({ rol: "admin" }, "-password");
    res.status(200).json({
      mensaje: "Lista de administradores obtenida correctamente.",
      total: admins.length,
      admins,
    });
  } catch (error) {
    console.error("❌ Error al listar admins:", error.message);
    res.status(500).json({ mensaje: "Error al listar administradores", error: error.message });
  }
};

const eliminarAdminInterno = async (req, res) => {
  try {
    const { id } = req.params;

    const credencial = await Credenciales.findById(id);
    if (!credencial) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    if (credencial.rol !== "admin") {
      return res.status(400).json({ mensaje: "El usuario no es un administrador" });
    }

    await Credenciales.findByIdAndDelete(id);

    res.status(200).json({
      mensaje: `Administrador con el correo ${credencial.email} eliminado exitosamente.`,
    });
  } catch (error) {
    console.error("❌ Error al eliminar admin:", error.message);
    res.status(500).json({ mensaje: "Error al eliminar administrador", error: error.message });
  }
};

module.exports = {
  listarAdminsInterno,
  eliminarAdminInterno,
};
