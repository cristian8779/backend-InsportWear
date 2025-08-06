const axios = require('axios');

// Variables base de entorno (sin `/api`)
const PRODUCTO_SERVICE_URL = process.env.PRODUCTO_SERVICE_URL;
const CATEGORIA_SERVICE_URL = process.env.CATEGORIA_SERVICE_URL;

// ✅ Obtener productos desde microservicio
const obtenerProductos = async () => {
  if (!PRODUCTO_SERVICE_URL) {
    console.error("❌ PRODUCTO_SERVICE_URL no está definido en el archivo .env");
    return [];
  }

  const url = `${PRODUCTO_SERVICE_URL}/api/productos`;
  console.log(`🔎 [Productos] Haciendo request a: ${url}`);

  try {
    const { data } = await axios.get(url);
    console.log(`✅ [Productos] Respuesta recibida (${Array.isArray(data) ? data.length : 0} items)`);
    return data;
  } catch (error) {
    if (error.response) {
      console.error(`❌ [Productos] Error ${error.response.status}: ${error.response.statusText}`);
      console.error(`📦 [Productos] Detalles:`, error.response.data);
    } else if (error.request) {
      console.error(`❌ [Productos] No hubo respuesta del servidor:`, error.message);
    } else {
      console.error(`❌ [Productos] Error al configurar la petición:`, error.message);
    }
    return [];
  }
};

// ✅ Obtener categorías desde microservicio
const obtenerCategorias = async () => {
  if (!CATEGORIA_SERVICE_URL) {
    console.error("❌ CATEGORIA_SERVICE_URL no está definido en el archivo .env");
    return [];
  }

  const url = `${CATEGORIA_SERVICE_URL}/api/categorias`;
  console.log(`🔎 [Categorías] Haciendo request a: ${url}`);

  try {
    const { data } = await axios.get(url);
    console.log(`✅ [Categorías] Respuesta recibida (${Array.isArray(data) ? data.length : 0} items)`);
    return data;
  } catch (error) {
    if (error.response) {
      console.error(`❌ [Categorías] Error ${error.response.status}: ${error.response.statusText}`);
      console.error(`📦 [Categorías] Detalles:`, error.response.data);
    } else if (error.request) {
      console.error(`❌ [Categorías] No hubo respuesta del servidor:`, error.message);
    } else {
      console.error(`❌ [Categorías] Error al configurar la petición:`, error.message);
    }
    return [];
  }
};

module.exports = {
  obtenerProductos,
  obtenerCategorias,
};
