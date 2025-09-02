const Historial = require('../models/Historial');
const formatearFecha = require('../utils/formatFecha'); // ✅ Usamos el helper

// 👉 Agregar producto al historial (evita duplicados por usuario y producto)
const agregarAlHistorial = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { productoId } = req.body;

    if (!productoId) {
      return res.status(400).json({ mensaje: 'Debes proporcionar el ID del producto.' });
    }

    // Verificar si ya existe hoy
    const hoy = new Date().toISOString().split('T')[0];
    const existente = await Historial.findOne({ usuario: usuarioId, producto: productoId });

    if (existente) {
      const fechaExistente = new Date(existente.fecha).toISOString().split('T')[0];
      if (fechaExistente === hoy) {
        return res.status(200).json({ mensaje: 'Ya se registró este producto hoy en el historial.' });
      }

      existente.fecha = new Date();
      await existente.save();
    } else {
      await Historial.create({ usuario: usuarioId, producto: productoId });
    }

    res.status(201).json({ mensaje: 'Producto agregado al historial correctamente.' });
  } catch (error) {
    console.error('Error al agregar al historial:', error);
    res.status(500).json({ mensaje: 'No se pudo agregar el producto al historial.', error: error.message });
  }
};

// 👉 Obtener historial agrupado por fecha (Hoy, Ayer, o fecha completa)
const obtenerHistorialAgrupadoPorFecha = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const historial = await Historial.find({ usuario: usuarioId })
      .sort({ fecha: -1 })
      .populate('producto', 'nombre precio imagen');

    if (historial.length === 0) {
      return res.json({ mensaje: 'Aún no has visto productos.', historial: {} });
    }

    const agrupado = {};

    historial.forEach(item => {
      const claveFecha = formatearFecha(new Date(item.fecha));

      if (!agrupado[claveFecha]) {
        agrupado[claveFecha] = [];
      }

      agrupado[claveFecha].push({
        _id: item._id,
        producto: item.producto,
        fecha: item.fecha
      });
    });

    res.json({ mensaje: 'Historial cargado correctamente.', historial: agrupado });
  } catch (error) {
    console.error('Error al agrupar historial:', error);
    res.status(500).json({ mensaje: 'No se pudo agrupar el historial.', error: error.message });
  }
};

// 👉 Eliminar un solo ítem del historial
const eliminarDelHistorial = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;

    const item = await Historial.findById(id);
    if (!item) {
      return res.status(404).json({ mensaje: 'No se encontró el producto en tu historial.' });
    }

    if (item.usuario.toString() !== usuarioId.toString()) {
      return res.status(403).json({ mensaje: 'No tienes permiso para eliminar este historial.' });
    }

    await Historial.findByIdAndDelete(id);
    res.json({ mensaje: 'Producto eliminado del historial.' });
  } catch (error) {
    console.error('Error al eliminar del historial:', error);
    res.status(500).json({ mensaje: 'No se pudo eliminar el producto del historial.', error: error.message });
  }
};

// 👉 Borrar todo el historial del usuario
const borrarHistorialCompleto = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    await Historial.deleteMany({ usuario: usuarioId });

    res.json({ mensaje: 'Tu historial fue eliminado completamente.' });
  } catch (error) {
    console.error('Error al borrar historial:', error);
    res.status(500).json({ mensaje: 'No se pudo borrar tu historial.', error: error.message });
  }
};

// 👉 Eliminar un producto de TODOS los historiales (cuando se elimina de la tienda)
const eliminarProductoDelHistorialGlobal = async (req, res) => {
  try {
    const { id } = req.params; // id del producto
    
    const resultado = await Historial.deleteMany({ producto: id });

    res.json({
      mensaje: `🗑️ Producto ${id} eliminado de ${resultado.deletedCount} historiales.`,
      resultado
    });
  } catch (error) {
    console.error("Error al eliminar producto del historial global:", error);
    res.status(500).json({ mensaje: "No se pudo eliminar el producto de los historiales.", error: error.message });
  }
};



module.exports = {
  agregarAlHistorial,
  obtenerHistorialAgrupadoPorFecha,
  eliminarDelHistorial,
  borrarHistorialCompleto,
  eliminarProductoDelHistorialGlobal   
};
