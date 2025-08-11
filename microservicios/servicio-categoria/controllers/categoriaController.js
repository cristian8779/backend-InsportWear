const axios = require('axios');
const Categoria = require('../models/Categoria');
const cloudinary = require('../config/cloudinary');

// 📂 Crear una categoría (con rollback de imagen en caso de error)
const crearCategoria = async (req, res) => {
  let imagenSubida = null; // Para tracking de rollback
  
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      // Si hay imagen, eliminarla antes de retornar error
      if (req.file?.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log(`🧹 Imagen eliminada tras error de permisos: ${req.file.filename}`);
      }
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para crear categorías.' });
    }

    let { nombre, descripcion } = req.body;

    // Validaciones básicas ANTES de procesar imagen
    if (!nombre || !descripcion) {
      // Limpiar imagen si las validaciones básicas fallan
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras error de validación: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Imagen eliminada exitosamente: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK: ${rollbackError.message}`);
          // Continuar aunque falle el rollback para no bloquear la respuesta
        }
      }
      return res.status(400).json({ mensaje: '⚠️ Todos los campos son obligatorios: nombre y descripción.' });
    }

    nombre = nombre.trim();
    descripcion = descripcion.trim();

    // Verificar campos vacíos después del trim
    if (!nombre || !descripcion) {
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras campos vacíos: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Imagen eliminada tras campos vacíos: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK - CAMPOS VACÍOS: ${rollbackError.message}`);
        }
      }
      return res.status(400).json({ mensaje: '⚠️ Los campos no pueden estar vacíos.' });
    }

    // Registrar imagen subida para posible rollback
    if (req.file?.filename) {
      imagenSubida = req.file.filename;
      console.log(`📷 Imagen registrada para rollback: ${imagenSubida}`);
    }

    // Verificar si ya existe una categoría con ese nombre
    const existe = await Categoria.findOne({ nombre });
    if (existe) {
      // Rollback: eliminar imagen si la categoría ya existe
      if (imagenSubida) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras categoría duplicada: ${imagenSubida}`);
          await cloudinary.uploader.destroy(imagenSubida);
          console.log(`✅ Imagen eliminada tras categoría duplicada: ${imagenSubida}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK - CATEGORÍA DUPLICADA: ${rollbackError.message}`);
        }
      }
      return res.status(400).json({ mensaje: '🚫 Ya existe una categoría con ese nombre.' });
    }

    let imagenUrl = null;
    if (req.file?.path) {
      imagenUrl = req.file.path;
    }

    const nuevaCategoria = new Categoria({
      nombre,
      descripcion,
      imagen: imagenUrl,
      public_id: req.file?.filename || ''
    });

    // Intentar guardar en la base de datos
    await nuevaCategoria.save();
    
    // Si llegamos aquí, todo salió bien - no hacer rollback
    imagenSubida = null;
    
    console.log(`✅ Categoría creada exitosamente: ${nuevaCategoria.nombre}`);
    res.status(201).json({
      mensaje: '✅ Categoría creada correctamente.',
      categoria: nuevaCategoria
    });

  } catch (error) {
    console.error("❌ Error en crearCategoria:", error);
    
    // ROLLBACK: Eliminar imagen de Cloudinary si algo falló
    if (imagenSubida) {
      try {
        console.log(`🧹 [CATCH] Intentando rollback de imagen: ${imagenSubida}`);
        await cloudinary.uploader.destroy(imagenSubida);
        console.log(`✅ [CATCH] Rollback: Imagen eliminada de Cloudinary: ${imagenSubida}`);
      } catch (rollbackError) {
        console.error(`❌ [CATCH] ERROR EN ROLLBACK DE IMAGEN: ${rollbackError.message}`);
      }
    }
    
    // Verificar si el error es por un duplicado
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
    console.error("❌ Error al obtener categorías:", error);
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
    console.error("❌ Error al buscar categoría por ID:", error);
    res.status(500).json({ mensaje: '❌ Error al buscar la categoría.', error: error.message });
  }
};

// 🛠️ Actualizar una categoría (con rollback de imagen en caso de error)
const actualizarCategoria = async (req, res) => {
  let nuevaImagenSubida = null; // Para tracking de rollback
  let imagenAnterior = null; // Para restaurar en caso de error
  
  try {
    if (!["admin", "superAdmin"].includes(req.usuario.rol)) {
      // Si hay nueva imagen, eliminarla antes de retornar error
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen tras error de permisos: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Nueva imagen eliminada tras error de permisos: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK DE PERMISOS: ${rollbackError.message}`);
        }
      }
      return res.status(403).json({ mensaje: '⛔ No tienes permisos para actualizar categorías.' });
    }

    const { id } = req.params;
    let { nombre, descripcion } = req.body;

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      // Si hay nueva imagen, eliminarla si la categoría no existe
      if (req.file?.filename) {
        try {
          console.log(`🧹 Intentando eliminar imagen - categoría no encontrada: ${req.file.filename}`);
          await cloudinary.uploader.destroy(req.file.filename);
          console.log(`✅ Nueva imagen eliminada - categoría no encontrada: ${req.file.filename}`);
        } catch (rollbackError) {
          console.error(`❌ ERROR EN ROLLBACK - CATEGORÍA NO ENCONTRADA: ${rollbackError.message}`);
        }
      }
      return res.status(404).json({ mensaje: '🚫 Categoría no encontrada.' });
    }

    // Registrar imágenes para posible rollback
    if (req.file?.filename) {
      nuevaImagenSubida = req.file.filename;
      imagenAnterior = { public_id: categoria.public_id, imagen: categoria.imagen };
      console.log(`📷 Nueva imagen registrada para rollback: ${nuevaImagenSubida}`);
      console.log(`📷 Imagen anterior registrada para rollback: ${imagenAnterior.public_id}`);
    }

    nombre = nombre?.trim() || categoria.nombre;
    descripcion = descripcion?.trim() || categoria.descripcion;

    // Verificar si hay otro documento con el mismo nombre (excluyendo el actual)
    if (nombre !== categoria.nombre) {
      const existe = await Categoria.findOne({ nombre, _id: { $ne: id } });
      if (existe) {
        // Rollback: eliminar nueva imagen si hay conflicto de nombre
        if (nuevaImagenSubida) {
          try {
            console.log(`🧹 Intentando eliminar imagen tras nombre duplicado: ${nuevaImagenSubida}`);
            await cloudinary.uploader.destroy(nuevaImagenSubida);
            console.log(`✅ Nueva imagen eliminada tras nombre duplicado: ${nuevaImagenSubida}`);
          } catch (rollbackError) {
            console.error(`❌ ERROR EN ROLLBACK - NOMBRE DUPLICADO: ${rollbackError.message}`);
          }
        }
        return res.status(400).json({ mensaje: '🚫 Ya existe una categoría con ese nombre.' });
      }
    }

    let nuevaImagen = categoria.imagen;
    let nuevoPublicId = categoria.public_id;

    // Si hay nueva imagen, actualizar los campos
    if (req.file?.path) {
      nuevaImagen = req.file.path;
      nuevoPublicId = req.file.filename;
    }

    // Intentar actualizar la categoría
    categoria.nombre = nombre;
    categoria.descripcion = descripcion;
    categoria.imagen = nuevaImagen;
    categoria.public_id = nuevoPublicId;

    await categoria.save();

    // Si llegamos aquí, la actualización fue exitosa
    // Eliminar la imagen anterior de Cloudinary si había una nueva
    if (req.file && imagenAnterior?.public_id) {
      await cloudinary.uploader.destroy(imagenAnterior.public_id);
      console.log(`🗑️ Imagen anterior eliminada de Cloudinary: ${imagenAnterior.public_id}`);
    }
    
    // No hacer rollback ya que todo salió bien
    nuevaImagenSubida = null;
    
    console.log(`✅ Categoría actualizada exitosamente: ${categoria.nombre}`);
    res.json({ mensaje: '✅ Categoría actualizada correctamente.', categoria });

  } catch (error) {
    console.error("❌ Error en actualizarCategoria:", error);
    
    // ROLLBACK: Eliminar nueva imagen si algo falló
    if (nuevaImagenSubida) {
      try {
        console.log(`🧹 [CATCH] Intentando rollback de nueva imagen: ${nuevaImagenSubida}`);
        await cloudinary.uploader.destroy(nuevaImagenSubida);
        console.log(`✅ [CATCH] Rollback: Nueva imagen eliminada de Cloudinary: ${nuevaImagenSubida}`);
      } catch (rollbackError) {
        console.error(`❌ [CATCH] ERROR EN ROLLBACK DE NUEVA IMAGEN: ${rollbackError.message}`);
      }
    }
    
    // Verificar si el error es por un duplicado
    if (error.code === 11000) {
      return res.status(409).json({ mensaje: '❌ Ya existe una categoría con el mismo nombre.', error: error.message });
    }
    
    res.status(500).json({ mensaje: '❌ Error al actualizar categoría.', error: error.message });
  }
};

// 🗑️ Eliminar una categoría (mejorado con verificación de productos)
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

    // Verificar si hay productos usando esta categoría
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
      console.error("Error al verificar productos relacionados:", error.message);
      return res.status(502).json({
        mensaje: '⚠️ No pudimos comprobar si esta categoría está en uso. Intenta nuevamente más tarde.',
        error: error.message
      });
    }

    // 🗑️ Eliminar imagen de Cloudinary si existe
    if (categoria.public_id) {
      await cloudinary.uploader.destroy(categoria.public_id);
      console.log(`🗑️ Imagen eliminada de Cloudinary: ${categoria.public_id}`);
    }
    // Fallback para el método anterior (por compatibilidad)
    else if (categoria.imagen && categoria.imagen.includes('res.cloudinary.com')) {
      const publicId = categoria.imagen.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`categorias/${publicId}`);
      console.log(`🗑️ Imagen eliminada de Cloudinary (método anterior): categorias/${publicId}`);
    }

    // 🗑️ Eliminar la categoría de la base de datos
    await Categoria.findByIdAndDelete(id);

    console.log(`✅ Categoría ${id} eliminada completamente (incluyendo imagen).`);
    res.json({ mensaje: '✅ Categoría eliminada correctamente.' });

  } catch (error) {
    console.error("❌ Error en eliminarCategoria:", error);
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