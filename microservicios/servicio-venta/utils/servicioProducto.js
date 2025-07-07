const axios = require("axios");

const BASE_URL_PRODUCTO = process.env.URL_MICROSERVICIO_PRODUCTO;
const BASE_URL_USUARIO = process.env.URL_MICROSERVICIO_USUARIO;

// 🔍 Obtener producto por ID
exports.obtenerProductoPorId = async (productoId) => {
  try {
    const { data } = await axios.get(`${BASE_URL_PRODUCTO}/${productoId}`);
    return data;
  } catch (error) {
    throw new Error(`Error al obtener el producto: ${error.response?.data?.mensaje || error.message}`);
  }
};

// ✅ Verifica y descuenta stock (general o variación)
exports.verificarYReducirStock = async ({ productoId, cantidad, talla, color }) => {
  try {
    // 1. Trae el producto completo
    const { producto } = await exports.obtenerProductoPorId(productoId);

    if (!producto) {
      throw new Error(`Producto con ID ${productoId} no encontrado`);
    }

    // 2. Si tiene variaciones
    if (producto.variaciones && producto.variaciones.length > 0) {
      const variacion = producto.variaciones.find(v => v.talla === talla && v.color === color);

      if (!variacion || variacion.stock < cantidad) {
        throw new Error(`No hay suficiente stock en la variación solicitada`);
      }

      // 3. Reduce stock de la variación
      await axios.put(`${BASE_URL_PRODUCTO}/${productoId}/reducir-stock-variacion`, {
        talla,
        color,
        cantidad
      });
    } else {
      // 4. Sin variaciones: stock general
      if (producto.stock < cantidad) {
        throw new Error("Stock insuficiente en el producto.");
      }

      await axios.put(`${BASE_URL_PRODUCTO}/${productoId}/reducir-stock`, {
        cantidad
      });
    }
  } catch (error) {
    throw new Error(`Error al verificar/reducir stock: ${error.response?.data?.mensaje || error.message}`);
  }
};

// 👤 Obtener usuario desde microservicio de usuarios
exports.obtenerUsuarioPorId = async (usuarioId) => {
  try {
    const { data } = await axios.get(`${BASE_URL_USUARIO}/api/usuarios/${usuarioId}`);
    return data.usuario;
  } catch (error) {
    throw new Error(`Error al obtener el usuario: ${error.response?.data?.mensaje || error.message}`);
  }
};
