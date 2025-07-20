const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');
const Historial = require('../models/Historial');
const axios = require('axios');

// 📦 Crear un producto
const crearProducto = async (req, res) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para agregar productos.' });
    }

    const { nombre, descripcion, precio, categoria, subcategoria, variaciones, stock, disponible } = req.body;

    if (
      typeof nombre !== 'string' || nombre.trim() === '' ||
      typeof descripcion !== 'string' || descripcion.trim() === '' ||
      isNaN(Number(precio)) ||
      typeof categoria !== 'string' || categoria.trim() === ''
    ) {
      return res.status(400).json({ mensaje: '⚠️ Campos obligatorios incompletos o inválidos: nombre, descripción, precio y categoría.' });
    }

    // Verificar que la categoría exista en otro servicio
    try {
      await axios.get(`${process.env.CATEGORIA_SERVICE_URL}/api/categorias/${categoria}`, { timeout: 3000 });
    } catch (err) {
      return res.status(503).json({ mensaje: '⚠️ No se pudo verificar la categoría. Puede ser un problema de conexión o la categoría no existe.' });
    }

    let variacionesParseadas = [];
    let stockFinal = stock || 0;

    if (variaciones) {
      try {
        variacionesParseadas = JSON.parse(variaciones);
        if (!Array.isArray(variacionesParseadas) || variacionesParseadas.length === 0) {
          return res.status(400).json({ mensaje: '⚠️ Debes agregar al menos una variación válida del producto.' });
        }
        // Validación personalizada: cada variación debe tener al menos tallaNumero o tallaLetra
        for (const v of variacionesParseadas) {
          if (!v.tallaNumero && !v.tallaLetra) {
            return res.status(400).json({ mensaje: 'Cada variación debe tener al menos tallaNumero o tallaLetra.' });
          }
        }
        stockFinal = 0; // Se ignora el stock general si hay variaciones
      } catch {
        return res.status(400).json({ mensaje: '⚠️ Error al procesar las variaciones. Debe ser un JSON válido.' });
      }
    }

    // Validación: si no hay variaciones, debe haber stock general mayor a 0
    if (variacionesParseadas.length === 0 && stockFinal <= 0) {
      return res.status(400).json({ mensaje: '⚠️ Debes proporcionar stock general o al menos una variación con stock.' });
    }

    const nuevoProducto = new Producto({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: Number(precio),
      categoria,
      subcategoria: subcategoria?.trim(),
      variaciones: variacionesParseadas,
      stock: stockFinal,
      disponible: disponible !== undefined ? disponible : true,
      imagen: req.file?.path || '',
      public_id: req.file?.filename || ''
    });

    await nuevoProducto.save();
    res.status(201).json({ mensaje: '✅ ¡Producto agregado exitosamente!', producto: nuevoProducto });
  } catch (error) {
    console.error("❌ Error en crearProducto:", error);
    res.status(500).json({ mensaje: '❌ Error al guardar el producto.', error: error.message });
  }
};

// 📄 Obtener todos los productos con filtros dinámicos
const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find();

    const subcategoriasSet = new Set();
    const tallasNumeroSet = new Set();
    const tallasLetraSet = new Set();
    const coloresSet = new Set();

    productos.forEach(producto => {
      if (producto.subcategoria) subcategoriasSet.add(producto.subcategoria);

      if (Array.isArray(producto.variaciones)) {
        producto.variaciones.forEach(variacion => {
          // Agregamos ambos tipos de talla a los filtros
          if (variacion.tallaNumero) tallasNumeroSet.add(variacion.tallaNumero);
          if (variacion.tallaLetra) tallasLetraSet.add(variacion.tallaLetra);
          if (variacion.color) coloresSet.add(variacion.color);
        });
      }
    });

    const filtrosDisponibles = {
      subcategorias: Array.from(subcategoriasSet),
      tallasNumero: Array.from(tallasNumeroSet),
      tallasLetra: Array.from(tallasLetraSet),
      colores: Array.from(coloresSet)
    };

    res.json({ productos, filtrosDisponibles });
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ mensaje: '❌ Error al cargar productos.', error: error.message });
  }
};

// 🔍 Obtener producto por ID (con historial)
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario?._id;
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
    }

    if (usuarioId) {
      await Historial.findOneAndUpdate(
        { usuario: usuarioId, producto: id },
        { fecha: Date.now() },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({ producto });
  } catch (error) {
    console.error("❌ Error al obtener producto por ID:", error);
    res.status(500).json({ mensaje: '❌ No se pudo obtener el producto.', error: error.message });
  }
};

// 📂 Obtener productos por ID de categoría
const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const productos = await Producto.find({ categoria: id });
    res.json({ productos });
  } catch (error) {
    console.error('❌ Error al obtener productos por categoría:', error);
    res.status(500).json({ mensaje: '❌ Error al buscar productos por categoría.', error: error.message });
  }
};

// 🛠️ Actualizar un producto
const actualizarProducto = async (req, res) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para modificar productos.' });
    }

    const { id } = req.params;
    const { nombre, descripcion, precio, categoria, subcategoria, variaciones, stock, disponible } = req.body;

    let producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
    }

    const actualizaciones = {};

    if (nombre && typeof nombre === 'string' && nombre.trim() !== '') actualizaciones.nombre = nombre.trim();
    if (descripcion && typeof descripcion === 'string') actualizaciones.descripcion = descripcion.trim();
    if (!isNaN(Number(precio))) actualizaciones.precio = Number(precio);
    if (categoria && typeof categoria === 'string') actualizaciones.categoria = categoria;
    if (subcategoria && typeof subcategoria === 'string') actualizaciones.subcategoria = subcategoria.trim();
    if (stock !== undefined) actualizaciones.stock = stock;
    if (disponible !== undefined) actualizaciones.disponible = disponible;

    if (variaciones) {
      try {
        const variacionesParseadas = JSON.parse(variaciones);
        if (!Array.isArray(variacionesParseadas) || variacionesParseadas.length === 0) {
          return res.status(400).json({ mensaje: '⚠️ Debes ingresar al menos una variación válida.' });
        }
        // Validación personalizada: cada variación debe tener al menos tallaNumero o tallaLetra
        for (const v of variacionesParseadas) {
          if (!v.tallaNumero && !v.tallaLetra) {
            return res.status(400).json({ mensaje: 'Cada variación debe tener al menos tallaNumero o tallaLetra.' });
          }
        }
        actualizaciones.variaciones = variacionesParseadas;
        actualizaciones.stock = 0;
      } catch {
        return res.status(400).json({ mensaje: '⚠️ Error al procesar las variaciones. Verifica el formato JSON.' });
      }
    }

    if (req.file) {
      if (producto.public_id) {
        await cloudinary.uploader.destroy(producto.public_id);
      }
      actualizaciones.imagen = req.file.path;
      actualizaciones.public_id = req.file.filename;
    }

    producto = await Producto.findByIdAndUpdate(id, actualizaciones, { new: true });
    res.json({ mensaje: '✅ Producto actualizado correctamente.', producto });
  } catch (error) {
    console.error("❌ Error en actualizarProducto:", error);
    res.status(500).json({ mensaje: '❌ No se pudo actualizar el producto.', error: error.message });
  }
};

// 🗑️ Eliminar un producto
const eliminarProducto = async (req, res) => {
  try {
    if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para eliminar productos.' });
    }

    const { id } = req.params;
    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
    }

    if (producto.public_id) {
      await cloudinary.uploader.destroy(producto.public_id);
    }

    await Producto.findByIdAndDelete(id);
    res.json({ mensaje: '✅ Producto eliminado exitosamente.' });
  } catch (error) {
    console.error("❌ Error en eliminarProducto:", error);
    res.status(500).json({ mensaje: '❌ Error al eliminar el producto.', error: error.message });
  }
};

// 🔄 Cambiar estado del producto (activo / descontinuado)
const cambiarEstadoProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'descontinuado'].includes(estado)) {
      return res.status(400).json({ mensaje: '⚠️ Estado no válido. Usa "activo" o "descontinuado".' });
    }

    const producto = await Producto.findByIdAndUpdate(id, { estado }, { new: true });
    if (!producto) {
      return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
    }

    res.json({ mensaje: '✅ Estado actualizado correctamente.', producto });
  } catch (error) {
    console.error("❌ Error al cambiar estado:", error);
    res.status(500).json({ mensaje: '❌ No se pudo cambiar el estado del producto.', error: error.message });
  }
};

// 📉 Reducir stock general
const reducirStock = async (req, res) => {
  try {
    const { cantidad } = req.body;
    const { id } = req.params;

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({ mensaje: '⚠️ Stock insuficiente.' });
    }

    producto.stock -= cantidad;
    await producto.save();

    res.json({ mensaje: '✅ Stock reducido correctamente.', producto });
  } catch (error) {
    console.error('❌ Error al reducir stock:', error);
    res.status(500).json({ mensaje: '❌ Error al reducir el stock.', error: error.message });
  }
};

// 📉 Reducir stock de una variación
const reducirStockVariacion = async (req, res) => {
  try {
    // Ahora permitimos buscar la variación por tallaNumero o tallaLetra
    const { cantidad, tallaNumero, tallaLetra, color } = req.body;
    const { id } = req.params;

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
    }

    const variacion = producto.variaciones.find(
      (v) =>
        v.color === color &&
        ((tallaNumero && v.tallaNumero === tallaNumero) || (tallaLetra && v.tallaLetra === tallaLetra))
    );

    if (!variacion) {
      return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });
    }

    if (variacion.stock < cantidad) {
      return res.status(400).json({ mensaje: '⚠️ Stock insuficiente en la variación.' });
    }

    variacion.stock -= cantidad;
    await producto.save();

    res.json({ mensaje: '✅ Stock reducido correctamente en la variación.', producto });
  } catch (error) {
    console.error('❌ Error al reducir stock de variación:', error);
    res.status(500).json({ mensaje: '❌ Error al reducir stock de variación.', error: error.message });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  cambiarEstadoProducto,
  obtenerProductosPorCategoria,
  reducirStock,
  reducirStockVariacion
};
