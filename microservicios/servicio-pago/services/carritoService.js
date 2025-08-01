const axios = require("axios");

const CARRITO_SERVICE_URL = process.env.CARRITO_SERVICE_URL;
const MICROSERVICIO_API_KEY = process.env.MICROSERVICIO_API_KEY;

exports.obtenerResumen = async (userId) => {
  if (!userId) {
    throw new Error("Falta userId para obtener el resumen del carrito.");
  }

  const res = await axios.get(`${CARRITO_SERVICE_URL}/api/resumen/${userId}`, {
    headers: {
      'x-api-key': MICROSERVICIO_API_KEY
    }
  });

  return res.data;
};

exports.vaciarCarrito = async (userId) => {
  if (!userId) {
    throw new Error("Falta userId para vaciar el carrito.");
  }

  await axios.delete(`${CARRITO_SERVICE_URL}/api/vaciar/${userId}`, {
    headers: {
      'x-api-key': MICROSERVICIO_API_KEY
    }
  });
};
