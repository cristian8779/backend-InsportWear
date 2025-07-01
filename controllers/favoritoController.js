const Favorito = require('../models/Favorito');
const Producto = require('../models/Producto');

// Añadir producto a favoritos
const agregarFavorito = async (req, res) => {
  try {
    const { productoId, talla, color } = req.body;
    const usuarioId = req.usuario._id;

    // Verifica si el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Verifica si esa variación existe
    const variacion = producto.variaciones.find(v => v.talla === talla && v.color === color);
    if (!variacion) {
      return res.status(400).json({ mensaje: 'La variación especificada no existe' });
    }

    // Verifica si ya está en favoritos (evita duplicados)
    const yaExiste = await Favorito.findOne({
      usuario: usuarioId,
      producto: productoId,
      'variacion.talla': talla,
      'variacion.color': color
    });

    if (yaExiste) {
      return res.status(409).json({ mensaje: 'Producto ya está en favoritos con esa variación' });
    }

    const favorito = new Favorito({
      usuario: usuarioId,
      producto: productoId,
      variacion: { talla, color }
    });

    await favorito.save();
    res.status(201).json({ mensaje: 'Producto agregado a favoritos', favorito });
  } catch (error) {
    console.error("Error al agregar a favoritos:", error);
    res.status(500).json({ mensaje: 'Error al agregar favorito', error: error.message });
  }
};

// Obtener favoritos del usuario con info de producto (incluye imagen)
const obtenerFavoritos = async (req, res) => {
  try {
    const favoritos = await Favorito.find({ usuario: req.usuario._id })
      .populate({
        path: 'producto',
        select: 'nombre descripcion precio imagen variaciones categoria'
      });

    res.json({ favoritos });
  } catch (error) {
    console.error("Error al obtener favoritos:", error);
    res.status(500).json({ mensaje: 'Error al obtener favoritos', error: error.message });
  }
};

// Eliminar un producto de favoritos
const eliminarFavorito = async (req, res) => {
  try {
    const { productoId, talla, color } = req.body;
    const usuarioId = req.usuario._id;

    const eliminado = await Favorito.findOneAndDelete({
      usuario: usuarioId,
      producto: productoId,
      'variacion.talla': talla,
      'variacion.color': color
    });

    if (!eliminado) {
      return res.status(404).json({ mensaje: 'El producto no está en tus favoritos con esa variación' });
    }

    res.json({ mensaje: 'Producto eliminado de favoritos' });
  } catch (error) {
    console.error("Error al eliminar favorito:", error);
    res.status(500).json({ mensaje: 'Error al eliminar favorito', error: error.message });
  }
};

module.exports = {
  agregarFavorito,
  obtenerFavoritos,
  eliminarFavorito
};
