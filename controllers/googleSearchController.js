const { buscarImagenesGoogle } = require('../utils/googleSearch');

/**
 * Controlador para buscar imágenes en Google Custom Search
 * Acceso solo para admin o superAdmin
 */
const buscarImagenesGoogleController = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      mensaje: "🔍 Debes proporcionar un término de búsqueda (por ejemplo: 'camisa', 'raqueta')."
    });
  }

  try {
    const imagenes = await buscarImagenesGoogle(query, 10);

    if (!imagenes.length) {
      return res.status(404).json({
        mensaje: `😕 No se encontraron imágenes para: "${query}". Intenta con otro término.`,
        sugerencia: "Evita palabras muy generales o abstractas."
      });
    }

    return res.status(200).json({
      mensaje: `✅ Imágenes encontradas para: "${query}". Selecciona la que prefieras para tu categoría.`,
      resultados: imagenes
    });

  } catch (error) {
    console.error('❌ Error al buscar imágenes:', error.message);
    return res.status(500).json({
      mensaje: '🚨 Ocurrió un error al buscar imágenes. Por favor, intenta nuevamente más tarde.',
      error: error.message
    });
  }
};

module.exports = {
  buscarImagenesGoogle: buscarImagenesGoogleController
};
