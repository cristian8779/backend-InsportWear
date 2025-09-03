const axios = require('axios');
const Categoria = require('../models/Categoria');
const cloudinary = require('../config/cloudinary');

// 📂 Crear una categoría (con rollback de imagen en caso de error)
const crearCategoria = async (req, res) => {
  let imagenSubida = null;
  
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para crear categorías.' });
    }

    let { nombre } = req.body;

    if (!nombre) {
      if (req.file?.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch {}
      }
      return res.status(400).json({ mensaje: '⚠️ El nombre es obligatorio.' });
    }

    nombre = nombre.trim();

    if (!nombre) {
      if (req.file?.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch {}
      }
      return res.status(400).json({ mensaje: '⚠️ El nombre no puede estar vacío.' });
    }

    if (req.file?.filename) {
      imagenSubida = req.file.filename;
    }

    const existe = await Categoria.findOne({ nombre });
    if (existe) {
      if (imagenSubida) {
        try {
          await cloudinary.uploader.destroy(imagenSubida);
        } catch {}
      }
      return res.status(400).json({ mensaje: '🚫 Ya existe una categoría con ese nombre.' });
    }

    let imagenUrl = null;
    if (req.file?.path) {
      imagenUrl = req.file.path;
    }

    const nuevaCategoria = new Categoria({
      nombre,
      imagen: imagenUrl,
      public_id: req.file?.filename || ''
    });

    await nuevaCategoria.save();
    imagenSubida = null;

    res.status(201).json({
      mensaje: '✅ Categoría creada correctamente.',
      categoria: nuevaCategoria
    });

  } catch (error) {
    if (imagenSubida) {
      try {
        await cloudinary.uploader.destroy(imagenSubida);
      } catch {}
    }

    if (error.code === 11000) {
      return res.status(409).json({ mensaje: '❌ Ya existe una categoría con el mismo nombre.', error: error.message });
    }

    res.status(500).json({ mensaje: '❌ Error al crear categoría.', error: error.message });
  }
};

// 📄 Obtener todas las categorías
const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find();
    res.json({ categorias });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al obtener categorías.', error: error.message });
  }
};

// 🔍 Obtener una categoría por ID
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

// 🛠️ Actualizar una categoría (con rollback de imagen en caso de error)
const actualizarCategoria = async (req, res) => {
  let nuevaImagenSubida = null;
  let imagenAnterior = null;
  
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      if (req.file?.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch {}
      }
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para actualizar categorías.' });
    }

    const { id } = req.params;
    let { nombre } = req.body;

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      if (req.file?.filename) {
        try {
          await cloudinary.uploader.destroy(req.file.filename);
        } catch {}
      }
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    if (req.file?.filename) {
      nuevaImagenSubida = req.file.filename;
      imagenAnterior = { public_id: categoria.public_id, imagen: categoria.imagen };
    }

    nombre = nombre?.trim() || categoria.nombre;

    if (nombre !== categoria.nombre) {
      const existe = await Categoria.findOne({ nombre, _id: { $ne: id } });
      if (existe) {
        if (nuevaImagenSubida) {
          try {
            await cloudinary.uploader.destroy(nuevaImagenSubida);
          } catch {}
        }
        return res.status(400).json({ mensaje: '🚫 Ya existe una categoría con ese nombre.' });
      }
    }

    let nuevaImagen = categoria.imagen;
    let nuevoPublicId = categoria.public_id;

    if (req.file?.path) {
      nuevaImagen = req.file.path;
      nuevoPublicId = req.file.filename;
    }

    categoria.nombre = nombre;
    categoria.imagen = nuevaImagen;
    categoria.public_id = nuevoPublicId;

    await categoria.save();

    if (req.file && imagenAnterior?.public_id) {
      await cloudinary.uploader.destroy(imagenAnterior.public_id);
    }

    nuevaImagenSubida = null;

    res.json({ mensaje: '✅ Categoría actualizada correctamente.', categoria });

  } catch (error) {
    if (nuevaImagenSubida) {
      try {
        await cloudinary.uploader.destroy(nuevaImagenSubida);
      } catch {}
    }

    if (error.code === 11000) {
      return res.status(409).json({ mensaje: '❌ Ya existe una categoría con el mismo nombre.', error: error.message });
    }

    res.status(500).json({ mensaje: '❌ Error al actualizar categoría.', error: error.message });
  }
};

// 🗑️ Eliminar una categoría (con verificación de productos relacionados)
const eliminarCategoria = async (req, res) => {
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para eliminar categorías.' });
    }

    const { id } = req.params;

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    try {
      const respuesta = await axios.get(`${process.env.PRODUCTO_SERVICE_URL || 'http://localhost:3003'}/api/productos/por-categoria/${id}`, {
        timeout: 5000,
        headers: {
          'x-api-key': process.env.MICROSERVICIO_API_KEY
        }
      });

      const productosRelacionados = respuesta.data?.productos || [];

      if (productosRelacionados.length > 0) {
        return res.status(400).json({
          mensaje: `⚠️ No se puede eliminar esta categoría porque hay ${productosRelacionados.length} producto(s) que la están usando.`,
          productosAfectados: productosRelacionados.length
        });
      }
    } catch (error) {
      return res.status(502).json({
        mensaje: '⚠️ No pudimos comprobar si esta categoría está en uso. Intenta nuevamente más tarde.',
        error: error.message
      });
    }

    if (categoria.public_id) {
      await cloudinary.uploader.destroy(categoria.public_id);
    } else if (categoria.imagen && categoria.imagen.includes('res.cloudinary.com')) {
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
