const axios = require("axios");

const CARRITO_SERVICE_URL = process.env.CARRITO_SERVICE_URL;
const MICROSERVICIO_API_KEY = process.env.MICROSERVICIO_API_KEY;

exports.obtenerResumen = async (userId) => {
  if (!userId) throw new Error("❌ Falta userId para obtener el resumen del carrito.");
  if (!CARRITO_SERVICE_URL || !MICROSERVICIO_API_KEY) {
    throw new Error("❌ Variables de entorno para carrito no configuradas correctamente.");
  }

  try {
    const res = await axios.get(`${CARRITO_SERVICE_URL}/api/resumen/${userId}`, {
      headers: { "x-api-key": MICROSERVICIO_API_KEY },
    });

    return res.data;
  } catch (error) {
    console.error("❌ Error al obtener resumen del carrito:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      `Error al obtener resumen del carrito: ${error.response?.data?.mensaje || error.message}`
    );
  }
};

exports.vaciarCarrito = async (userId) => {
  if (!userId) throw new Error("❌ Falta userId para vaciar el carrito.");
  if (!CARRITO_SERVICE_URL || !MICROSERVICIO_API_KEY) {
    throw new Error("❌ Variables de entorno para carrito no configuradas correctamente.");
  }

  try {
    const res = await axios.delete(`${CARRITO_SERVICE_URL}/api/vaciar/${userId}`, {
      headers: { "x-api-key": MICROSERVICIO_API_KEY },
    });

    return res.data; // 👈 opcional: podrías retornar confirmación del vaciado
  } catch (error) {
    console.error("❌ Error al vaciar carrito:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      `Error al vaciar carrito: ${error.response?.data?.mensaje || error.message}`
    );
  }
};
