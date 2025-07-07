const axios = require('axios');
const Categoria = require('../models/Categoria');
const cloudinary = require('../config/cloudinary');
const subirImagenDesdeInternet = require('../utils/subirDesdeUrl');


// Crear una categoría (Admin o SuperAdmin)
const crearCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para crear categorías.' });
    }

    let { nombre, descripcion, imagenInternet } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).json({ mensaje: '⚠️ Todos los campos son obligatorios: nombre y descripción.' });
    }

    nombre = nombre.trim();
    descripcion = descripcion.trim();

    const existe = await Categoria.findOne({ nombre });
    if (existe) {
      return res.status(400).json({ mensaje: '🚫 Ya existe una categoría con ese nombre.' });
    }

    let imagenUrl = null;

    if (req.file?.path) {
      imagenUrl = req.file.path;
    } else if (imagenInternet?.trim()) {
      imagenUrl = await subirImagenDesdeInternet(imagenInternet.trim());
    }

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen: imagenUrl
    });

    await nuevaCategoria.save();

    res.status(201).json({
      mensaje: '✅ Categoría creada correctamente.',
      categoria: nuevaCategoria
    });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al crear categoría.', error: error.message });
  }
};

// Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json({ categorias });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al obtener categorías.', error: error.message });
  }
};

// Obtener una categoría por ID
const obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.findById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    res.json(categoria);
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al buscar la categoría.', error: error.message });
  }
};

// Actualizar una categoría (Admin o SuperAdmin)
const actualizarCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para actualizar categorías.' });
    }

    const { id } = req.params;
    let { nombre, descripcion, imagenInternet } = req.body;

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    nombre = nombre?.trim() || categoria.nombre;
    descripcion = descripcion?.trim() || categoria.descripcion;

    let nuevaImagen = categoria.imagen;
    const hayNuevaImagen = req.file?.path || imagenInternet?.trim();

    // Eliminar imagen anterior si es de Cloudinary
    if (hayNuevaImagen && categoria.imagen?.includes('res.cloudinary.com')) {
      const parts = categoria.imagen.split('/');
      const nombreConExtension = parts[parts.length - 1];
      const publicId = `categorias/${nombreConExtension.split('.')[0]}`;
      await cloudinary.uploader.destroy(publicId);
    }

    if (req.file?.path) {
      nuevaImagen = req.file.path;
    } else if (imagenInternet?.trim()) {
      nuevaImagen = await subirImagenDesdeInternet(imagenInternet.trim());
    }

    categoria.nombre = nombre;
    categoria.descripcion = descripcion;
    categoria.imagen = nuevaImagen;

    await categoria.save();

    res.json({ mensaje: '✅ Categoría actualizada correctamente.', categoria });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al actualizar categoría.', error: error.message });
  }
};

// Eliminar una categoría (Admin o SuperAdmin)
const eliminarCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para eliminar categorías.' });
    }

    const { id } = req.params;

    try {
      const respuesta = await axios.get(`http://localhost:3003/api/productos/por-categoria/${id}`, {
        timeout: 3000,
      });

      const productosRelacionados = respuesta.data?.productos || [];

      if (productosRelacionados.length > 0) {
        return res.status(400).json({
          mensaje: '⚠️ No se puede eliminar esta categoría porque hay productos que la están usando.'
        });
      }
    } catch (error) {
      return res.status(502).json({
        mensaje: '⚠️ No pudimos comprobar si esta categoría está en uso. Intenta nuevamente más tarde.',
        error: error.message
      });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    if (categoria.imagen && categoria.imagen.includes('res.cloudinary.com')) {
      const publicId = categoria.imagen.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`categorias/${publicId}`);
    }

    await Categoria.findByIdAndDelete(id);

    res.json({ mensaje: '✅ Categoría eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al eliminar categoría.', error: error.message });
  }
};

module.exports = {
  crearCategoria,
  obtenerCategorias,
  obtenerCategoriaPorId,
  actualizarCategoria,
  eliminarCategoria
};
