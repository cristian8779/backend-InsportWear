const Credenciales = require("../models/Credenciales");

// ✅ Listar todos los admins
const listarAdmins = async (req, res) => {
  try {
    if (req.usuario.rol !== "superAdmin") {
      return res.status(403).json({ mensaje: "Acceso denegado. Solo el SuperAdmin puede ver esta lista de administradores." });
    }

    const admins = await Credenciales.find({ rol: "admin" }, "-password");

    if (admins.length === 0) {
      return res.json({ mensaje: "No hay administradores registrados aún. 🫡" });
    }

    res.json({
      mensaje: "Lista de administradores obtenida correctamente 👇",
      total: admins.length,
      admins
    });
  } catch (error) {
    res.status(500).json({ mensaje: "Ocurrió un error al obtener los administradores. Intenta de nuevo más tarde.", error: error.message });
  }
};

// ❌ Eliminar admin por ID
const eliminarAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "superAdmin") {
      return res.status(403).json({ mensaje: "Acceso denegado. Solo el SuperAdmin puede eliminar administradores." });
    }

    const { id } = req.params;

    const credencial = await Credenciales.findById(id);
    if (!credencial) {
      return res.status(404).json({ mensaje: "No se encontró ningún usuario con ese ID." });
    }

    if (credencial.rol !== "admin") {
      return res.status(400).json({ mensaje: `El usuario con ID ${id} no tiene rol de administrador.` });
    }

    await Credenciales.findByIdAndDelete(id);
    res.json({ mensaje: `Administrador con email ${credencial.email} eliminado exitosamente 🗑️` });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar al administrador. Intenta más tarde o contacta soporte.", error: error.message });
  }
};

module.exports = {
  listarAdmins,
  eliminarAdmin,
};
