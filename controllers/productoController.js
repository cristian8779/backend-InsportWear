const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const cloudinary = require('../config/cloudinary');
const Historial = require('../models/Historial');

// Crear un producto (Admin o SuperAdmin)
const crearProducto = async (req, res) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para agregar productos' });
    }

    const { nombre, descripcion, precio, categoria, variaciones, stock, disponible } = req.body;

    if (!nombre || !descripcion || !precio || !categoria) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    const categoriaExistente = await Categoria.findById(categoria);
    if (!categoriaExistente) {
      return res.status(400).json({ mensaje: 'Categoría no válida' });
    }

    let variacionesParseadas = [];
    if (variaciones) {
      try {
        variacionesParseadas = JSON.parse(variaciones);
        if (!Array.isArray(variacionesParseadas) || variacionesParseadas.length === 0) {
          return res.status(400).json({ mensaje: 'Debe haber al menos una variación válida' });
        }
      } catch (err) {
        return res.status(400).json({ mensaje: 'Variaciones mal formateadas' });
      }
    }

    let imagenUrl = '', publicId = '';
    if (req.file) {
      const subida = await cloudinary.uploader.upload(req.file.path, { folder: 'productos' });
      imagenUrl = subida.secure_url;
      publicId = subida.public_id;
    }

    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      precio,
      categoria,
      variaciones: variacionesParseadas,
      stock: stock || 0,
      disponible: disponible !== undefined ? disponible : true,
      imagen: imagenUrl,
      public_id: publicId
    });

    await nuevoProducto.save();

    res.status(201).json({ mensaje: 'Producto agregado correctamente', producto: nuevoProducto });
  } catch (error) {
    console.error("Error en crearProducto:", error);
    res.status(500).json({ mensaje: 'Error al agregar producto', error: error.message });
  }
};

// Obtener todos los productos
const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find().populate('categoria', 'nombre');
    res.json({ productos });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};

// Obtener producto por ID + registrar en historial
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?._id;

    const producto = await Producto.findById(id).populate('categoria', 'nombre');
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    if (usuarioId) {
      await Historial.findOneAndUpdate(
        { usuario: usuarioId, producto: id },
        { fecha: Date.now() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ producto });
  } catch (error) {
    console.error("Error al obtener producto por ID:", error);
    res.status(500).json({ mensaje: 'Error al obtener producto', error: error.message });
  }
};

// Actualizar un producto (Admin o SuperAdmin)
const actualizarProducto = async (req, res) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para actualizar productos' });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, variaciones, stock, disponible } = req.body;

    let producto = await Producto.findById(id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    const actualizaciones = {};

    if (nombre) actualizaciones.nombre = nombre;
    if (descripcion) actualizaciones.descripcion = descripcion;
    if (precio) actualizaciones.precio = precio;
    if (categoria) actualizaciones.categoria = categoria;
    if (stock !== undefined) actualizaciones.stock = stock;
    if (disponible !== undefined) actualizaciones.disponible = disponible;

    if (variaciones) {
      try {
        const variacionesParseadas = JSON.parse(variaciones);
        if (!Array.isArray(variacionesParseadas) || variacionesParseadas.length === 0) {
          return res.status(400).json({ mensaje: 'Debe haber al menos una variación válida' });
        }
        actualizaciones.variaciones = variacionesParseadas;
      } catch (err) {
        return res.status(400).json({ mensaje: 'Variaciones mal formateadas' });
      }
    }

    if (req.file) {
      if (producto.public_id) {
        await cloudinary.uploader.destroy(producto.public_id);
      }

      const subida = await cloudinary.uploader.upload(req.file.path, { folder: 'productos' });
      actualizaciones.imagen = subida.secure_url;
      actualizaciones.public_id = subida.public_id;
    }

    producto = await Producto.findByIdAndUpdate(id, actualizaciones, { new: true });

    res.json({ mensaje: 'Producto actualizado correctamente', producto });
  } catch (error) {
    console.error("Error en actualizarProducto:", error);
    res.status(500).json({ mensaje: 'Error al actualizar producto', error: error.message });
  }
};

// Eliminar un producto (Admin o SuperAdmin)
const eliminarProducto = async (req, res) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para eliminar productos' });
    }

    const { id } = req.params;
    const producto = await Producto.findById(id);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    if (producto.public_id) {
      await cloudinary.uploader.destroy(producto.public_id);
    }

    await Producto.findByIdAndDelete(id);
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error("Error en eliminarProducto:", error);
    res.status(500).json({ mensaje: 'Error al eliminar producto', error: error.message });
  }
};

// Cambiar estado (activo o descontinuado)
const cambiarEstadoProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'descontinuado'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    const producto = await Producto.findByIdAndUpdate(id, { estado }, { new: true });
    if (!producto) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    res.json({ mensaje: 'Estado del producto actualizado', producto });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    res.status(500).json({ mensaje: 'Error al cambiar estado del producto', error: error.message });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  cambiarEstadoProducto
};
