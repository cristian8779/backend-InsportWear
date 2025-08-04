const axios = require("axios");
const VENTA_SERVICE_URL = process.env.VENTA_SERVICE_URL;

exports.crearVenta = async ({ usuarioId, productos, total, estadoPago, referenciaPago }) => {
  if (!VENTA_SERVICE_URL) {
    throw new Error("VENTA_SERVICE_URL no está configurada.");
  }

  try {
    const res = await axios.post(`${VENTA_SERVICE_URL}/crear`, {
      usuarioId,
      productos,
      total,
      estadoPago,
      referenciaPago,
    });
    return res.data;
  } catch (error) {
    throw new Error(
      `Error al crear venta: ${error.response?.data?.mensaje || error.message}`
    );
  }
};
