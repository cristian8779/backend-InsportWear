const axios = require("axios");

const PRODUCTO_SERVICE_URL = process.env.PRODUCTO_SERVICE_URL;
const MICROSERVICIO_API_KEY = process.env.MICROSERVICIO_API_KEY;

// 🔧 Limpiar URL base usando PRODUCTO_SERVICE_URL
const BASE_URL = PRODUCTO_SERVICE_URL?.replace(/\/+$/, "");

if (!BASE_URL || !MICROSERVICIO_API_KEY) {
  console.error("❌ Configuración inválida en variables de entorno:");
  console.error("🔑 PRODUCTO_SERVICE_URL:", PRODUCTO_SERVICE_URL);
  console.error("🔑 MICROSERVICIO_API_KEY:", MICROSERVICIO_API_KEY);
  throw new Error(
    "❌ Variables de entorno para producto/variaciones no configuradas correctamente."
  );
}

/**
 * Reducir stock de una variación específica
 * @param {String} productoId
 * @param {String} variacionId
 * @param {Number} cantidad
 */
exports.reducirStock = async (productoId, variacionId, cantidad) => {
  // Validaciones estrictas
  if (!productoId) {
    throw new Error("❌ Falta productoId para reducir stock de variación.");
  }
  if (!variacionId) {
    throw new Error("❌ Falta variacionId para reducir stock de variación.");
  }
  if (cantidad == null || isNaN(cantidad) || cantidad <= 0) {
    throw new Error(
      "❌ La cantidad a reducir debe ser un número mayor a 0."
    );
  }

  const url = `${BASE_URL}/api/productos/${productoId}/variaciones/${variacionId}/reducir-stock`;

  try {
    const res = await axios.put(
      url,
      { cantidad },
      {
        headers: { "x-api-key": MICROSERVICIO_API_KEY },
      }
    );

    // ✅ Confirmación del stock actualizado
    return res.data;
  } catch (error) {
    console.error("❌ Error al reducir stock de variación:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    throw new Error(
      `Error al reducir stock de variación: ${
        error.response?.data?.mensaje || error.message
      }`
    );
  }
};
