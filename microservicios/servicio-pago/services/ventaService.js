const axios = require("axios");
const VENTA_SERVICE_URL = process.env.VENTA_SERVICE_URL;

exports.crearVenta = async ({ usuarioId, productos, total, estadoPago, referenciaPago }) => {
  const res = await axios.post(`${VENTA_SERVICE_URL}/crear`, {
    usuarioId,
    productos,
    total,
    estadoPago,
    referenciaPago,
  });
  return res.data;
};
