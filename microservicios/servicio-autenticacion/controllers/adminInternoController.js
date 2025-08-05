const axios = require("axios");
const Credenciales = require("../models/Credenciales");

// 🔐 Solo uso interno por otros microservicios

// ✅ Listar todos los administradores, incluyendo nombre desde microservicio de usuarios
const listarAdminsInterno = async (req, res) => {
  try {
    const admins = await Credenciales.find({ rol: "admin" }, "-password");

    if (admins.length === 0) {
      return res.status(200).json({
        mensaje: "No hay administradores registrados.",
        total: 0,
        admins: [],
      });
    }

    // Extraer los IDs de las credenciales
    const ids = admins.map((admin) => admin._id.toString());

    const usuariosServiceUrl = process.env.USUARIO_SERVICE_URL;
    if (!usuariosServiceUrl) {
      console.error("❌ USUARIO_SERVICE_URL no está definido en el entorno.");
      return res.status(500).json({
        mensaje: "Configuración interna incompleta (USUARIO_SERVICE_URL faltante).",
      });
    }

   const endpoint = `${usuariosServiceUrl}/api/usuario/interno/usuarios-por-credenciales`;

    console.log("📡 Enviando POST a:", endpoint);
    console.log("🧾 Payload:", ids);

    const response = await axios.post(endpoint, { ids }, { timeout: 3000 });

    const usuarios = response.data.usuarios || [];

    // 🔗 Unir admins con sus nombres correspondientes
    const adminsConNombre = admins.map((admin) => {
      const usuario = usuarios.find(
        (u) => u.credenciales === admin._id.toString()
      );

      return {
        _id: admin._id,
        email: admin.email,
        rol: admin.rol,
        refreshToken: admin.refreshToken,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        nombre: usuario?.nombre || null,
      };
    });

    console.log("✅ Admins con nombres obtenidos correctamente.");

    res.status(200).json({
      mensaje: "Lista de administradores obtenida correctamente.",
      total: adminsConNombre.length,
      admins: adminsConNombre,
    });
  } catch (error) {
    console.error("❌ Error al listar admins:");
    if (error.response) {
      console.error("↪️ Status:", error.response.status);
      console.error("↪️ Data:", error.response.data);
    } else {
      console.error("↪️ Message:", error.message);
    }

    const status = error.response?.status || 500;
    const mensaje =
      error.response?.data?.mensaje || "Error al listar administradores";

    res.status(status).json({
      mensaje,
      error: error.message,
    });
  }
};

// ✅ Eliminar administrador por ID
const eliminarAdminInterno = async (req, res) => {
  try {
    const { id } = req.params;

    const credencial = await Credenciales.findById(id);
    if (!credencial) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (credencial.rol !== "admin") {
      return res.status(400).json({ mensaje: "El usuario no es un administrador." });
    }

    await Credenciales.findByIdAndDelete(id);

    console.log(`🗑️ Admin eliminado: ${credencial.email}`);

    res.status(200).json({
      mensaje: `Administrador con el correo ${credencial.email} eliminado exitosamente.`,
    });
  } catch (error) {
    console.error("❌ Error al eliminar admin:", error.message);

    res.status(500).json({
      mensaje: "Error al eliminar administrador.",
      error: error.message,
    });
  }
};

module.exports = {
  listarAdminsInterno,
  eliminarAdminInterno,
};
