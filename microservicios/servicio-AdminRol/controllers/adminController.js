const axios = require("axios");

// 🔐 Listar todos los administradores (solo SuperAdmin puede)
const listarAdmins = async (req, res) => {
  try {
    if (req.usuario.rol !== "superAdmin") {
      return res.status(403).json({
        mensaje: "Acceso restringido. Solo el SuperAdmin puede ver la lista de administradores.",
      });
    }

    const respuesta = await axios.get(`${process.env.AUTH_URL}/interno/admins`, {
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    return res.status(respuesta.status).json(respuesta.data);
  } catch (error) {
    console.error("❌ Error al obtener admins desde servicio de autenticación:", error.message);

    const status = error.response?.status || 500;
    const mensaje = error.response?.data?.mensaje || "No se pudo obtener la lista de administradores.";

    return res.status(status).json({ mensaje });
  }
};

// 🔐 Eliminar administrador por ID (solo SuperAdmin puede)
const eliminarAdmin = async (req, res) => {
  try {
    if (req.usuario.rol !== "superAdmin") {
      return res.status(403).json({
        mensaje: "Acción no permitida. Solo el SuperAdmin puede eliminar administradores.",
      });
    }

    const { id } = req.params;

    const respuesta = await axios.delete(`${process.env.AUTH_URL}/interno/admins/${id}`, {
      headers: {
        Authorization: req.header("Authorization"),
      },
    });

    return res.status(respuesta.status).json(respuesta.data);
  } catch (error) {
    console.error("❌ Error al eliminar admin desde servicio de autenticación:", error.message);

    const status = error.response?.status || 500;
    const mensaje = error.response?.data?.mensaje || "No se pudo eliminar al administrador.";

    return res.status(status).json({ mensaje });
  }
};

module.exports = {
  listarAdmins,
  eliminarAdmin,
};
