exports.obtenerResumen = async (userId) => {
  if (!userId) throw new Error("Falta userId para obtener el resumen del carrito.");

  try {
    const res = await axios.get(`${CARRITO_SERVICE_URL}/api/resumen/${userId}`, {
      headers: { 'x-api-key': MICROSERVICIO_API_KEY }
    });
    return res.data;
  } catch (error) {
    throw new Error(`Error al obtener resumen del carrito: ${error.response?.data?.mensaje || error.message}`);
  }
};

exports.vaciarCarrito = async (userId) => {
  if (!userId) throw new Error("Falta userId para vaciar el carrito.");

  try {
    await axios.delete(`${CARRITO_SERVICE_URL}/api/vaciar/${userId}`, {
      headers: { 'x-api-key': MICROSERVICIO_API_KEY }
    });
  } catch (error) {
    throw new Error(`Error al vaciar carrito: ${error.response?.data?.mensaje || error.message}`);
  }
};
