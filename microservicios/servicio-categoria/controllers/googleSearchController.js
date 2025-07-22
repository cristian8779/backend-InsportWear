const Categoria = require('../models/Categoria');
const { buscarImagenesGoogle } = require('../utils/googleSearch');
const cloudinary = require('../config/cloudinary');
const SearchQuota = require('../models/SearchQuota'); // Modelo para controlar el uso diario

/**
 * Controlador para buscar imágenes desde Google Custom Search
 * Solo accesible por admin o superAdmin
 */
const buscarImagenesGoogleController = async (req, res) => {
  let { query, page = 1, limit = 20 } = req.query;

  // Validar que query esté presente
  if (!query) {
    return res.status(400).json({
      mensaje: "🔍 Para ayudarte mejor, por favor ingresa un término de búsqueda. Ejemplo: 'zapatillas', 'raqueta', 'camisa'."
    });
  }

  // Validar que `page` y `limit` sean números válidos
  page = Math.max(1, parseInt(page));  // Asegura que la página sea al menos 1
  limit = Math.max(1, parseInt(limit)); // Asegura que el límite sea al menos 1

  try {
    // Verificar cuota diaria
    const hoy = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    let cuota = await SearchQuota.findOne({ fecha: hoy });

    if (!cuota) {
      cuota = await SearchQuota.create({ fecha: hoy, usadas: 1 });
    } else {
      if (cuota.usadas >= 100) {
        return res.status(429).json({
          mensaje: "🚫 Has alcanzado el límite diario de 100 búsquedas permitidas por el sistema.",
          detalle: "Esta restricción existe para optimizar recursos. Podrás volver a buscar imágenes mañana.",
          busquedas_restantes: 0,
          limite_diario: 100
        });
      }
      cuota.usadas += 1;
      await cuota.save();
    }

    // Buscar imágenes con paginación
    const imagenes = await buscarImagenesGoogle(query, limit, (page - 1) * limit);

    if (!imagenes || imagenes.length === 0) {
      return res.status(404).json({
        mensaje: `😕 No se encontraron resultados para "${query}".`,
        sugerencia: "Te recomendamos usar términos más específicos. Evita palabras muy generales como 'ropa', 'producto' o 'color'.",
        busquedas_restantes: Math.max(100 - cuota.usadas, 0),
        limite_diario: 100
      });
    }

    // Preparar la respuesta con solo los detalles necesarios
    const resultados = imagenes.map((imagen) => ({
      url: imagen.url,                          // URL de la imagen
      titulo: imagen.titulo || 'Sin título',     // Título de la imagen
      origen: imagen.origen || 'Desconocido'     // URL de la página de origen
    }));

    res.status(200).json({
      mensaje: `✅ Se encontraron imágenes relacionadas con: "${query}". Selecciona la que mejor represente tu categoría.`,
      resultados,
      pagina_actual: page,
      resultados_por_pagina: limit,
      busquedas_restantes: Math.max(100 - cuota.usadas, 0),
      limite_diario: 100
    });

  } catch (error) {
    console.error('❌ Error al buscar imágenes:', error.message);
    res.status(500).json({
      mensaje: '💥 Lo sentimos, ocurrió un problema al intentar contactar el buscador de imágenes.',
      sugerencia: 'Por favor, intenta nuevamente más tarde.',
      error: error.response ? error.response.data : error.message // Detalles del error
    });
  }
};

/**
 * Consultar el estado actual de la cuota de búsqueda diaria
 * Útil para mostrar visualmente cuántas búsquedas quedan
 */
const obtenerCuotaBusqueda = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const cuota = await SearchQuota.findOne({ fecha: hoy });

    const usadas = cuota ? cuota.usadas : 0;
    const restantes = Math.max(100 - usadas, 0);

    res.status(200).json({
      mensaje: '📊 Este es el estado actual de tus búsquedas diarias.',
      usadas,
      restantes,
      limite_diario: 100,
      porcentaje_usado: Math.round((usadas / 100) * 100)
    });
  } catch (error) {
    console.error('❌ Error al obtener la cuota de búsqueda:', error.message);
    res.status(500).json({
      mensaje: '💥 Error al consultar la cuota diaria.',
      sugerencia: 'Intenta nuevamente más tarde.',
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
    return res.status(400).json({
      mensaje: '🔗 Para asociar una imagen, primero debes proporcionar una URL válida.'
    });
  }

  try {
    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({
        mensaje: '🚫 No se encontró la categoría seleccionada.',
        sugerencia: 'Verifica que el ID sea correcto o selecciona otra categoría.'
      });
    }

    // Eliminar imagen anterior si es de Cloudinary
    if (categoria.imagen?.includes('res.cloudinary.com')) {
      const nombreConExtension = categoria.imagen.split('/').pop();
      const publicId = `categorias/${nombreConExtension.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    // Asociar la nueva imagen
    categoria.imagen = urlImagen;
    await categoria.save();

    res.status(200).json({
      mensaje: '📸 Imagen asociada correctamente a la categoría.',
      detalle: 'Esta nueva imagen será visible en el catálogo o módulo correspondiente.',
      categoria
    });

  } catch (error) {
    console.error('❌ Error al actualizar la imagen de la categoría:', error.message);
    res.status(500).json({
      mensaje: '💥 Ocurrió un error inesperado al intentar guardar la imagen.',
      sugerencia: 'Intenta nuevamente más tarde o contacta a soporte si el problema persiste.',
      error: error.message
    });
  }
};

module.exports = {
  buscarImagenesGoogle: buscarImagenesGoogleController,
  asociarImagenInternetACategoria,
  obtenerCuotaBusqueda // ← nuevo export
};
