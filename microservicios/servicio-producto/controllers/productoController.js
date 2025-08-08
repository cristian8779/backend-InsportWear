const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');
const Historial = require('../models/Historial');
const axios = require('axios');
const redisClient = require('../config/redis');

// 📦 Crear un producto (con rollback de imagen en caso de error)
const crearProducto = async (req, res) => {
    let imagenSubida = null; // Para tracking de rollback
    
    try {
        if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
            // Si hay imagen, eliminarla antes de retornar error
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename);
                console.log(`🧹 Imagen eliminada tras error de permisos: ${req.file.filename}`);
            }
            return res.status(403).json({ mensaje: '⛔ No tienes permisos para agregar productos.' });
        }

        const { nombre, descripcion, precio, categoria, subcategoria, stock, disponible } = req.body;

        // Validaciones básicas ANTES de procesar imagen
        if (
            typeof nombre !== 'string' || nombre.trim() === '' ||
            typeof descripcion !== 'string' || descripcion.trim() === '' ||
            isNaN(Number(precio)) ||
            typeof categoria !== 'string' || categoria.trim() === ''
        ) {
            // Limpiar imagen si las validaciones básicas fallan
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename);
                console.log(`🧹 Imagen eliminada tras error de validación: ${req.file.filename}`);
            }
            return res.status(400).json({ mensaje: '⚠️ Campos obligatorios incompletos o inválidos: nombre, descripción, precio y categoría.' });
        }

        // Registrar imagen subida para posible rollback
        if (req.file?.filename) {
            imagenSubida = req.file.filename;
            console.log(`📷 Imagen registrada para rollback: ${imagenSubida}`);
        }

        // Verificar que la categoría exista en otro servicio
        try {
            await axios.get(`${process.env.CATEGORIA_SERVICE_URL}/api/categorias/${categoria}`, { timeout: 3000 });
        } catch (err) {
            console.error("Error al verificar categoría:", err.message);
            
            // Rollback: eliminar imagen si la categoría no existe
            if (imagenSubida) {
                await cloudinary.uploader.destroy(imagenSubida);
                console.log(`🧹 Imagen eliminada tras error de categoría: ${imagenSubida}`);
            }
            
            return res.status(503).json({ mensaje: '⚠️ No se pudo verificar la categoría. Puede ser un problema de conexión o la categoría no existe.' });
        }

        const stockFinal = stock || 0;

        if (stockFinal <= 0) {
            // Rollback: eliminar imagen si el stock es inválido
            if (imagenSubida) {
                await cloudinary.uploader.destroy(imagenSubida);
                console.log(`🧹 Imagen eliminada tras error de stock: ${imagenSubida}`);
            }
            
            return res.status(400).json({ mensaje: '⚠️ Debes proporcionar un stock general mayor a 0 para el producto.' });
        }

        // Crear el producto
        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio: Number(precio),
            categoria,
            subcategoria: subcategoria?.trim(),
            stock: stockFinal,
            disponible: disponible !== undefined ? disponible : true,
            imagen: req.file?.path || '',
            public_id: req.file?.filename || ''
        });

        // Intentar guardar en la base de datos
        await nuevoProducto.save();
        
        // Si llegamos aquí, todo salió bien - no hacer rollback
        imagenSubida = null;
        
        // Limpiar caché
        await redisClient.del('productos_todos');
        
        console.log(`✅ Producto creado exitosamente: ${nuevoProducto.nombre}`);
        res.status(201).json({ mensaje: '✅ ¡Producto agregado exitosamente!', producto: nuevoProducto });
        
    } catch (error) {
        console.error("❌ Error en crearProducto:", error);
        
        // ROLLBACK: Eliminar imagen de Cloudinary si algo falló
        if (imagenSubida) {
            try {
                await cloudinary.uploader.destroy(imagenSubida);
                console.log(`🧹 Rollback: Imagen eliminada de Cloudinary: ${imagenSubida}`);
            } catch (rollbackError) {
                console.error(`⚠️ Error en rollback de imagen: ${rollbackError.message}`);
            }
        }
        
        // Verificar si el error es por un duplicado
        if (error.code === 11000) {
            return res.status(409).json({ mensaje: '❌ Ya existe un producto con el mismo nombre o identificador único.', error: error.message });
        }
        
        res.status(500).json({ mensaje: '❌ Error al guardar el producto.', error: error.message });
    }
};

// 📄 Obtener todos los productos con filtros dinámicos
const obtenerProductos = async (req, res) => {
    const cacheKey = 'productos_todos';
    try {
        const cache = await redisClient.get(cacheKey);
        if (cache && cache.result && Object.keys(req.query).length === 0) {
            console.log('🟢 Productos cargados desde Redis');
            return res.json(JSON.parse(cache.result));
        }

        const { categoria, subcategoria, minPrecio, maxPrecio, disponible, busqueda } = req.query;
        let query = {};

        if (categoria) query.categoria = categoria;
        if (subcategoria) query.subcategoria = subcategoria;
        if (minPrecio || maxPrecio) {
            query.precio = {};
            if (minPrecio) query.precio.$gte = Number(minPrecio);
            if (maxPrecio) query.precio.$lte = Number(maxPrecio);
        }
        if (disponible !== undefined) query.disponible = disponible === 'true';
        if (busqueda) {
            query.$or = [
                { nombre: { $regex: busqueda, $options: 'i' } },
                { descripcion: { $regex: busqueda, $options: 'i' } }
            ];
        }

        const productos = await Producto.find(query).populate('variaciones');
        const allProducts = await Producto.find();
        const subcategoriasSet = new Set();
        allProducts.forEach(producto => {
            if (producto.subcategoria) subcategoriasSet.add(producto.subcategoria);
        });

        const filtrosDisponibles = {
            subcategorias: Array.from(subcategoriasSet).sort(),
        };

        const response = { productos, filtrosDisponibles };

        if (Object.keys(req.query).length === 0) {
            await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 });
        }

        console.log('🟡 Productos cargados desde DB y procesados');
        res.json(response);
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
        const producto = await Producto.findById(id).populate('variaciones');

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
        const productos = await Producto.find({ categoria: id }).populate('variaciones');
        res.json({ productos });
    } catch (error) {
        console.error('❌ Error al obtener productos por categoría:', error);
        res.status(500).json({ mensaje: '❌ Error al buscar productos por categoría.', error: error.message });
    }
};

// 🛠️ Actualizar un producto (con rollback de imagen en caso de error)
const actualizarProducto = async (req, res) => {
    let nuevaImagenSubida = null; // Para tracking de rollback
    let imagenAnterior = null; // Para restaurar en caso de error
    
    try {
        if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
            // Si hay nueva imagen, eliminarla antes de retornar error
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename);
                console.log(`🧹 Nueva imagen eliminada tras error de permisos: ${req.file.filename}`);
            }
            return res.status(403).json({ mensaje: '⛔ No tienes permisos para modificar productos.' });
        }

        const { id } = req.params;
        const { nombre, descripcion, precio, categoria, subcategoria, stock, disponible } = req.body;

        let producto = await Producto.findById(id);
        if (!producto) {
            // Si hay nueva imagen, eliminarla si el producto no existe
            if (req.file?.filename) {
                await cloudinary.uploader.destroy(req.file.filename);
                console.log(`🧹 Nueva imagen eliminada - producto no encontrado: ${req.file.filename}`);
            }
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        // Registrar imágenes para posible rollback
        if (req.file?.filename) {
            nuevaImagenSubida = req.file.filename;
            imagenAnterior = { public_id: producto.public_id, imagen: producto.imagen };
            console.log(`📷 Nueva imagen registrada para rollback: ${nuevaImagenSubida}`);
            console.log(`📷 Imagen anterior registrada para rollback: ${imagenAnterior.public_id}`);
        }

        const actualizaciones = {};

        // Validaciones y actualizaciones
        if (nombre && typeof nombre === 'string' && nombre.trim() !== '') actualizaciones.nombre = nombre.trim();
        if (descripcion && typeof descripcion === 'string') actualizaciones.descripcion = descripcion.trim();
        if (!isNaN(Number(precio))) actualizaciones.precio = Number(precio);
        if (categoria && typeof categoria === 'string') actualizaciones.categoria = categoria;
        if (subcategoria && typeof subcategoria === 'string') actualizaciones.subcategoria = subcategoria.trim();
        if (stock !== undefined) actualizaciones.stock = stock;
        if (disponible !== undefined) actualizaciones.disponible = disponible;

        // Actualizar imagen si se provee una nueva
        if (req.file) {
            actualizaciones.imagen = req.file.path;
            actualizaciones.public_id = req.file.filename;
        }

        // Intentar actualizar el producto
        producto = await Producto.findByIdAndUpdate(id, actualizaciones, { new: true });
        
        // Si llegamos aquí, la actualización fue exitosa
        // Eliminar la imagen anterior de Cloudinary si había una nueva
        if (req.file && imagenAnterior?.public_id) {
            await cloudinary.uploader.destroy(imagenAnterior.public_id);
            console.log(`🗑️ Imagen anterior eliminada de Cloudinary: ${imagenAnterior.public_id}`);
        }
        
        // No hacer rollback ya que todo salió bien
        nuevaImagenSubida = null;
        
        // Limpiar caché
        await redisClient.del('productos_todos');
        
        console.log(`✅ Producto actualizado exitosamente: ${producto.nombre}`);
        res.json({ mensaje: '✅ Producto actualizado correctamente.', producto });
        
    } catch (error) {
        console.error("❌ Error en actualizarProducto:", error);
        
        // ROLLBACK: Eliminar nueva imagen y restaurar la anterior si es posible
        if (nuevaImagenSubida) {
            try {
                await cloudinary.uploader.destroy(nuevaImagenSubida);
                console.log(`🧹 Rollback: Nueva imagen eliminada de Cloudinary: ${nuevaImagenSubida}`);
            } catch (rollbackError) {
                console.error(`⚠️ Error en rollback de nueva imagen: ${rollbackError.message}`);
            }
        }
        
        res.status(500).json({ mensaje: '❌ No se pudo actualizar el producto.', error: error.message });
    }
};

// 🗑️ Eliminar un producto (mejorado)
const eliminarProducto = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: '⛔ No tienes permisos para eliminar productos.' });
        }

        const { id } = req.params;
        const producto = await Producto.findById(id).populate('variaciones'); 
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        // Eliminar imágenes de variaciones
        if (producto.variaciones && producto.variaciones.length > 0) {
            console.log(`🗑️ Preparando para eliminar imágenes de ${producto.variaciones.length} variaciones de Cloudinary.`);
            for (const variacion of producto.variaciones) {
                // Actualizado para el nuevo modelo de una sola imagen
                if (variacion.imagen?.public_id) {
                    await cloudinary.uploader.destroy(variacion.imagen.public_id);
                    console.log(`   - 🗑️ Imagen de variación eliminada: ${variacion.imagen.public_id}`);
                }
                // Mantener compatibilidad con el modelo anterior por si acaso
                if (variacion.imagenes && variacion.imagenes.length > 0) {
                    for (const img of variacion.imagenes) {
                        if (img.public_id) {
                            await cloudinary.uploader.destroy(img.public_id);
                            console.log(`   - 🗑️ Imagen de variación eliminada (modelo anterior): ${img.public_id}`);
                        }
                    }
                }
            }
            console.log("👍 Todas las imágenes de variaciones han sido eliminadas de Cloudinary.");
        }

        // Eliminar la imagen principal del producto
        if (producto.public_id) {
            await cloudinary.uploader.destroy(producto.public_id);
            console.log(`🗑️ Imagen principal eliminada: ${producto.public_id}`);
        }

        // Eliminar el producto de la base de datos
        await Producto.findByIdAndDelete(id);
        
        // Limpiar caché
        await redisClient.del('productos_todos');
        
        console.log(`✅ Producto ${id} eliminado completamente.`);
        res.json({ mensaje: '✅ Producto eliminado exitosamente.' });
    } catch (error) {
        console.error("❌ Error en eliminarProducto:", error);
        res.status(500).json({ mensaje: '❌ Error al eliminar el producto.', error: error.message });
    }
};

// 🔄 Cambiar estado del producto (corregido)
const cambiarEstadoProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar estados válidos
        const estadosValidos = ['activo', 'descontinuado'];
        if (!estadosValidos.includes(estado)) {
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

        if (producto.stock === undefined || producto.stock < cantidad) {
            return res.status(400).json({ mensaje: '⚠️ Stock general insuficiente.' });
        }

        producto.stock -= cantidad;
        await producto.save();

        res.json({ mensaje: '✅ Stock general reducido correctamente.', producto });
    } catch (error) {
        console.error('❌ Error al reducir stock:', error);
        res.status(500).json({ mensaje: '❌ Error al reducir el stock general.', error: error.message });
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
};