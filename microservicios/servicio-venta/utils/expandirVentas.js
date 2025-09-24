// utils/expandirVentas.js
const axios = require("axios");
const URL_USUARIO = process.env.URL_MICROSERVICIO_USUARIO;

// 🔄 Obtener usuario completo desde microservicio de usuarios
const obtenerUsuarioPorId = async (id) => {
  try {
    if (!URL_USUARIO) throw new Error("❌ URL_MICROSERVICIO_USUARIO no está configurada en .env");

    const { data } = await axios.get(`${URL_USUARIO}/${id}`);
    if (data?.usuario) return data.usuario;
    if (data?.data) return data.data;

    return data;
  } catch (error) {
    console.error(`❌ Error al obtener usuario (${id}):`, error.response?.data || error.message);
    return { nombre: "Desconocido", telefono: "", direccion: {} };
  }
};

// 🔹 Función para expandir ventas agregando info del usuario
async function expandirVentas(ventas) {
  return Promise.all(
    ventas.map(async (venta) => {
      const usuario = await obtenerUsuarioPorId(venta.usuarioId);
      return {
        ...venta._doc, // si usas Mongoose
        nombreUsuario: usuario.nombre || "Desconocido",
        telefonoUsuario: usuario.telefono || "",
        direccionUsuario: usuario.direccion || {},
      };
    })
  );
}

// ⚡ Exportamos directamente la función
module.exports = expandirVentas;
