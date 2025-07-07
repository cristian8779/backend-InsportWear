const Favorito = require('../models/Favorito');
const Producto = require('../models/producto');

// Añadir producto a favoritos (sin variaciones)
const agregarFavorito = async (req, res) => {
  try {
    const { productoId } = req.body;
    const usuarioId = req.usuario._id;

    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'El producto que intentas guardar no existe o fue eliminado.' });
    }

    const yaExiste = await Favorito.findOne({ usuario: usuarioId, producto: productoId });
    if (yaExiste) {
      return res.status(409).json({ mensaje: 'Este producto ya está en tu lista de favoritos.' });
    }

    const favorito = new Favorito({
      usuario: usuarioId,
      producto: productoId
    });

    await favorito.save();
    res.status(201).json({ mensaje: '✅ ¡Producto guardado en tus favoritos con éxito!', favorito });
  } catch (error) {
    console.error("❌ Error al agregar favorito:", error);
    res.status(500).json({
      mensaje: 'Ocurrió un error al intentar guardar el producto en tus favoritos. Por favor, intenta nuevamente.',
      error: error.message
    });
  }
};

// Obtener favoritos del usuario con info del producto
const obtenerFavoritos = async (req, res) => {
  try {
    const favoritos = await Favorito.find({ usuario: req.usuario._id }).populate({
      path: 'producto',
      select: 'nombre descripcion precio imagen categoria'
    });

    if (favoritos.length === 0) {
      return res.json({ mensaje: 'Aún no tienes productos guardados en favoritos.', favoritos: [] });
    }

    res.json({ mensaje: '✅ Lista de tus productos favoritos', favoritos });
  } catch (error) {
    console.error("❌ Error al obtener favoritos:", error);
    res.status(500).json({
      mensaje: 'No pudimos cargar tu lista de favoritos. Por favor, intenta más tarde.',
      error: error.message
    });
  }
};

// Eliminar favorito (solo por productoId)
const eliminarFavorito = async (req, res) => {
  try {
    const { productoId } = req.body;
    const usuarioId = req.usuario._id;

    const eliminado = await Favorito.findOneAndDelete({
      usuario: usuarioId,
      producto: productoId
    });

    if (!eliminado) {
      return res.status(404).json({ mensaje: 'El producto no estaba en tu lista de favoritos.' });
    }

    res.json({ mensaje: '🗑️ Producto eliminado de tus favoritos con éxito.' });
  } catch (error) {
    console.error("❌ Error al eliminar favorito:", error);
    res.status(500).json({
      mensaje: 'Ocurrió un error al intentar eliminar el producto de tus favoritos. Intenta de nuevo más tarde.',
      error: error.message
    });
  }
};

module.exports = {
  agregarFavorito,
  obtenerFavoritos,
  eliminarFavorito
};
