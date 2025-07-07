const Categoria = require('../models/Categoria');
const { buscarImagenesGoogle } = require('../utils/googleSearch');
const cloudinary = require('../config/cloudinary');

/**
 * Controlador para buscar imágenes desde Google Custom Search
 * Solo accesible por admin o superAdmin
 */
const buscarImagenesGoogleController = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({
      mensaje: "🔍 Debes ingresar un término para buscar imágenes. Ejemplo: 'zapatillas', 'raqueta', 'camisa'."
    });
  }

  try {
    const imagenes = await buscarImagenesGoogle(query, 10);

    if (!imagenes.length) {
      return res.status(404).json({
        mensaje: `😕 No se encontraron imágenes para "${query}". Intenta con una palabra más específica.`,
        sugerencia: "Evita términos demasiado generales como 'ropa', 'color', 'producto'."
      });
    }

    res.status(200).json({
      mensaje: `✅ Se encontraron imágenes para: "${query}". Haz clic en una para asociarla a tu categoría.`,
      resultados: imagenes
    });

  } catch (error) {
    console.error('❌ Error al buscar imágenes:', error.message);
    res.status(500).json({
      mensaje: '🚨 Ocurrió un error al contactar el buscador de imágenes. Intenta nuevamente más tarde.',
      error: error.message
    });
  }
};

/**
 * Asociar una imagen externa a una categoría (Admin o SuperAdmin)
 */
const asociarImagenInternetACategoria = async (req, res) => {
  const { id } = req.params;
  const { urlImagen } = req.body;

  if (!urlImagen) {
    return res.status(400).json({ mensaje: '🔗 Debes proporcionar una URL de imagen válida.' });
  }

  try {
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    // Si ya tiene una imagen en Cloudinary, eliminarla
    if (categoria.imagen?.includes('res.cloudinary.com')) {
      const nombreConExtension = categoria.imagen.split('/').pop();
      const publicId = `categorias/${nombreConExtension.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    // Asociar la nueva imagen desde internet
    categoria.imagen = urlImagen;
    await categoria.save();

    res.status(200).json({
      mensaje: '📸 Imagen actualizada correctamente. Ahora esta imagen está asociada a la categoría.',
      categoria
    });

  } catch (error) {
    console.error('❌ Error al actualizar la imagen de la categoría:', error.message);
    res.status(500).json({
      mensaje: '💥 Hubo un error al actualizar la imagen. Intenta nuevamente.',
      error: error.message
    });
  }
};

module.exports = {
  buscarImagenesGoogle: buscarImagenesGoogleController,
  asociarImagenInternetACategoria
};
