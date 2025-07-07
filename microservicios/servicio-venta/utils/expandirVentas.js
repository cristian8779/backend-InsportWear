const axios = require("axios");

const URL_USUARIO = process.env.URL_MICROSERVICIO_USUARIO;
const URL_PRODUCTO = process.env.URL_MICROSERVICIO_PRODUCTO;

// 🔄 Obtener usuario por ID
const obtenerUsuarioPorId = async (id) => {
  try {
    const { data } = await axios.get(`${URL_USUARIO}/${id}`);
    return data?.usuario || data;
  } catch (error) {
    console.error(`❌ Error al obtener usuario (${id}):`, error.response?.data || error.message);
    throw new Error("Usuario no encontrado");
  }
};

// 🧾 Expandir ventas con nombre de usuario y nombre de producto ya persistido
const expandirVentas = async (ventas) => {
  return Promise.all(
    ventas.map(async (venta) => {
      // 👤 Expandir nombre del usuario
      try {
        const usuario = await obtenerUsuarioPorId(venta.usuarioId);
        venta.nombreUsuario = typeof usuario?.nombre === "string"
          ? usuario.nombre.trim()
          : "Usuario eliminado";
      } catch (err) {
        venta.nombreUsuario = "Usuario eliminado";
      }

      // 📦 Validar nombreProducto ya guardado en los datos
      venta.productos = (venta.productos || []).map((p) => {
        // Asegurar que sea un objeto plano
        const productoPlano =
          typeof p.toObject === "function"
            ? p.toObject()
            : JSON.parse(JSON.stringify(p));

        const nombreProducto = typeof p.nombreProducto === "string" && p.nombreProducto.trim()
          ? p.nombreProducto.trim()
          : "Producto eliminado";

        return {
          ...productoPlano,
          nombreProducto,
        };
      });

      return venta;
    })
  );
};

module.exports = expandirVentas;
