const Credenciales = require("../models/Credenciales");

// ✅ Cambiar rol directamente desde el microservicio de autenticación
const cambiarRolUsuarioPorCorreo = async (req, res) => {
  try {
    const { email, nuevoRol } = req.body;
    const rolSolicitante = req.usuario?.rol;

    if (!email || !nuevoRol) {
      return res.status(400).json({
        mensaje: "Correo electrónico y nuevo rol son requeridos.",
      });
    }

    if (rolSolicitante !== "superAdmin") {
      return res.status(403).json({
        mensaje: "No tienes permisos para cambiar el rol de otros usuarios.",
      });
    }

    const emailLimpio = email.trim().toLowerCase();
    const credencial = await Credenciales.findOne({ email: emailLimpio });

    if (!credencial) {
      return res.status(404).json({
        mensaje: "No se encontró un usuario registrado con ese correo.",
      });
    }

    if (credencial.rol === nuevoRol) {
      return res.status(400).json({
        mensaje: `El usuario ya tiene el rol "${nuevoRol}".`,
      });
    }

    credencial.rol = nuevoRol;
    await credencial.save();

    return res.status(200).json({
      ok: true,
      mensaje: `✅ El rol del usuario fue actualizado correctamente a "${nuevoRol}".`,
    });
  } catch (error) {
    console.error("❌ Error al cambiar el rol:", error.message);
    return res.status(500).json({
      mensaje: "Ocurrió un error al cambiar el rol. Intenta nuevamente más tarde.",
    });
  }
};

module.exports = {
  cambiarRolUsuarioPorCorreo,
};
