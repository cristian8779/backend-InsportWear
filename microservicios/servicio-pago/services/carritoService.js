const axios = require("axios");

const CARRITO_SERVICE_URL = process.env.CARRITO_SERVICE_URL;
const MICROSERVICIO_API_KEY = process.env.MICROSERVICIO_API_KEY;

// 🔧 Limpia la URL base por si viene con barra final
const BASE_URL = CARRITO_SERVICE_URL?.replace(/\/+$/, "");

if (!BASE_URL || !MICROSERVICIO_API_KEY) {
  console.error("❌ Configuración inválida en variables de entorno:");
  console.error("🔑 CARRITO_SERVICE_URL:", CARRITO_SERVICE_URL);
  console.error("🔑 MICROSERVICIO_API_KEY:", MICROSERVICIO_API_KEY);
  throw new Error("❌ Variables de entorno para carrito no configuradas correctamente.");
}

exports.obtenerResumen = async (userId) => {
  if (!userId) {
    throw new Error("❌ Falta userId para obtener el resumen del carrito.");
  }

  const url = `${BASE_URL}/api/resumen/${userId}`;

  try {
    const res = await axios.get(url, {
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
  if (!userId) {
    throw new Error("❌ Falta userId para vaciar el carrito.");
  }

  const url = `${BASE_URL}/api/vaciar/${userId}`;

  try {
    const res = await axios.delete(url, {
      headers: { "x-api-key": MICROSERVICIO_API_KEY },
    });

    return res.data; // ✅ Confirmación del vaciado
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
