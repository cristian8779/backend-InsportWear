const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');

// Crear una categoría (Admin o SuperAdmin)
const crearCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para crear categorías' });
    }

    let { nombre, descripcion, imagenInternet } = req.body;

    if (!nombre || !descripcion) {
      return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
    }

    nombre = nombre.trim();
    descripcion = descripcion.trim();

    const existe = await Categoria.findOne({ nombre });
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya existe una categoría con ese nombre' });
    }

    let imagenUrl = req.file?.path || imagenInternet || null;

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen: imagenUrl
    });

    await nuevaCategoria.save();

    res.status(201).json({
      mensaje: 'Categoría creada correctamente',
      categoria: nuevaCategoria
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear categoría', error: error.message });
  }
};

// Obtener todas las categorías (acceso público)
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json({ categorias });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
  }
};

// Actualizar una categoría (Admin o SuperAdmin)
const actualizarCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para actualizar categorías' });
    }

    const { id } = req.params;
    let { nombre, descripcion, imagenInternet } = req.body;

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    nombre = nombre?.trim() || categoria.nombre;
    descripcion = descripcion?.trim() || categoria.descripcion;

    let nuevaImagen = categoria.imagen;

    if (req.file) {
      if (categoria.imagen) {
        const publicId = categoria.imagen.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`productos/${publicId}`);
      }
      nuevaImagen = req.file.path;
    } else if (imagenInternet) {
      nuevaImagen = imagenInternet;
    }

    categoria.nombre = nombre;
    categoria.descripcion = descripcion;
    categoria.imagen = nuevaImagen;

    await categoria.save();

    res.json({ mensaje: 'Categoría actualizada correctamente', categoria });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar categoría', error: error.message });
  }
};

// Eliminar una categoría (Admin o SuperAdmin)
const eliminarCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para eliminar categorías' });
    }

    const { id } = req.params;

    const productosRelacionados = await Producto.find({ categoria: id });
    if (productosRelacionados.length > 0) {
      return res.status(400).json({
        mensaje: 'No se puede eliminar la categoría porque está en uso por productos'
      });
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    if (categoria.imagen) {
      const publicId = categoria.imagen.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`productos/${publicId}`);
    }

    await Categoria.findByIdAndDelete(id);

    res.json({ mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar categoría', error: error.message });
  }
};

module.exports = {
  crearCategoria,
  obtenerCategorias,
  actualizarCategoria,
  eliminarCategoria
};
