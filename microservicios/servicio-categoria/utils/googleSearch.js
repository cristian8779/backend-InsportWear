const axios = require('axios');

const buscarImagenesGoogle = async (query, cantidad = 10, offset = 0) => {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const CX = process.env.GOOGLE_CX;

  if (!API_KEY || !CX) throw new Error('❌ Faltan GOOGLE_API_KEY o GOOGLE_CX en el .env');

  // Asegurarse de que cantidad no exceda el límite de 10 resultados por solicitud
  cantidad = Math.min(cantidad, 10);

  // Calcular el valor de start para paginación
  const start = (offset * cantidad) + 1;  // Ajusta el valor de start correctamente para la paginación

  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&searchType=image&cx=${CX}&key=${API_KEY}&num=${cantidad}&start=${start}&fileType=jpg&imgSize=large`;

  try {
    const response = await axios.get(url);

    // Verifica que la respuesta tenga elementos en 'items'
    if (!response.data.items) {
      throw new Error(`No se encontraron imágenes para la consulta "${query}".`);
    }

    // Mapeo de los resultados
    const imagenes = response.data.items.map((item) => ({
      url: item.link,                          // URL de la imagen
      titulo: item.title,                       // Título de la imagen
      origen: item.image.contextLink,           // URL de la página de origen
    }));

    return imagenes;

  } catch (error) {
    console.error('❌ Error al obtener las imágenes:', error.message);
    // Muestra los detalles del error si existe respuesta del servidor
    if (error.response) {
      console.error('Detalles del error de la API:', error.response.data);
    }
    throw new Error(`💥 Ocurrió un error al intentar obtener las imágenes. Motivo: ${error.message}`);
  }
};

module.exports = { buscarImagenesGoogle };
