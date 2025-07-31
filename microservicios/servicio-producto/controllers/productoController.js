const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');
const Historial = require('../models/Historial');
const axios = require('axios');
const redisClient = require('../config/redis');

// 📦 Crear un producto
const crearProducto = async (req, res) => {
    try {
        if (!['admin', 'superAdmin'].includes(req.usuario.rol)) {
            return res.status(403).json({ mensaje: '⛔ No tienes permisos para agregar productos.' });
        }

        const { nombre, descripcion, precio, categoria, subcategoria, stock, disponible } = req.body;

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
            // Se asume que CATEGORIA_SERVICE_URL está definida en tus variables de entorno
            await axios.get(`${process.env.CATEGORIA_SERVICE_URL}/api/categorias/${categoria}`, { timeout: 3000 });
        } catch (err) {
            console.error("Error al verificar categoría:", err.message);
            return res.status(503).json({ mensaje: '⚠️ No se pudo verificar la categoría. Puede ser un problema de conexión o la categoría no existe.' });
        }

        // Se asume que si el producto tiene stock, es stock general y no de variaciones
        const stockFinal = stock || 0;

        // Validación: el producto debe tener stock general mayor a 0 si no hay variaciones adjuntas
        // (Aunque las variaciones se manejen aparte, el producto base aún podría necesitar un stock inicial)
        if (stockFinal <= 0) {
            // Considerar si es obligatorio stock general si el producto SÓLO se vende por variaciones
            // Si un producto solo se vende por sus variaciones, este chequeo puede ser opcional
            return res.status(400).json({ mensaje: '⚠️ Debes proporcionar un stock general mayor a 0 para el producto.' });
        }

        const nuevoProducto = new Producto({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            precio: Number(precio),
            categoria,
            subcategoria: subcategoria?.trim(),
            // Las variaciones no se manejan directamente en la creación del producto aquí.
            // Se añadirán o gestionarán desde el controlador de variaciones de forma separada.
            stock: stockFinal, // Este stock se refiere al stock global del producto sin variaciones
            disponible: disponible !== undefined ? disponible : true,
            imagen: req.file?.path || '',
            public_id: req.file?.filename || ''
        });

        await nuevoProducto.save();
        // Limpia la caché de todos los productos para que la próxima solicitud recupere el nuevo producto
        await redisClient.del('productos_todos');
        res.status(201).json({ mensaje: '✅ ¡Producto agregado exitosamente!', producto: nuevoProducto });
    } catch (error) {
        console.error("❌ Error en crearProducto:", error);
        // Verificar si el error es por un duplicado (ej. nombre único si se aplica)
        if (error.code === 11000) { // Código de error de duplicado en MongoDB
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
        // Si hay datos en caché y no se están usando filtros específicos, se devuelven
        if (cache && cache.result && Object.keys(req.query).length === 0) {
            console.log('🟢 Productos cargados desde Redis');
            return res.json(JSON.parse(cache.result));
        }

        // Parámetros de filtro del request
        const { categoria, subcategoria, minPrecio, maxPrecio, disponible, busqueda } = req.query;
        let query = {};

        // Aplicar filtros basados en los parámetros de consulta
        if (categoria) {
            query.categoria = categoria;
        }
        if (subcategoria) {
            query.subcategoria = subcategoria;
        }
        if (minPrecio || maxPrecio) {
            query.precio = {};
            if (minPrecio) {
                query.precio.$gte = Number(minPrecio);
            }
            if (maxPrecio) {
                query.precio.$lte = Number(maxPrecio);
            }
        }
        if (disponible !== undefined) {
            // Convierte el string 'true' o 'false' a booleano
            query.disponible = disponible === 'true';
        }
        if (busqueda) {
            // Búsqueda por nombre o descripción usando una expresión regular insensible a mayúsculas/minúsculas
            query.$or = [
                { nombre: { $regex: busqueda, $options: 'i' } },
                { descripcion: { $regex: busqueda, $options: 'i' } }
            ];
        }

        // Ejecutar la consulta a la base de datos
        // Se carga las variaciones asociadas (si las tienes como referencia en el modelo Producto)
        const productos = await Producto.find(query).populate('variaciones');

        // Recolectar subcategorías disponibles para filtros.
        // Se buscan en TODOS los productos para ofrecer una lista completa de opciones de filtro.
        const allProducts = await Producto.find();
        const subcategoriasSet = new Set();
        allProducts.forEach(producto => {
            if (producto.subcategoria) subcategoriasSet.add(producto.subcategoria);
        });

        const filtrosDisponibles = {
            subcategorias: Array.from(subcategoriasSet).sort(), // Asegúrate de ordenar aquí también
            // Los filtros de tallas, colores, etc., son responsabilidad del controlador de variaciones
        };

        const response = { productos, filtrosDisponibles };

        // Solo guardar en caché si no se aplicaron filtros (para la lista completa)
        if (Object.keys(req.query).length === 0) {
            await redisClient.set(cacheKey, JSON.stringify(response), { EX: 60 }); // Caché por 60 segundos
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
        // Se carga el producto y sus variaciones asociadas
        const producto = await Producto.findById(id).populate('variaciones');

        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        // Registrar en el historial si hay un usuario logueado
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
        // Se cargan los productos de la categoría específica, incluyendo sus variaciones
        const productos = await Producto.find({ categoria: id }).populate('variaciones');
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
        const { nombre, descripcion, precio, categoria, subcategoria, stock, disponible } = req.body;

        let producto = await Producto.findById(id);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        const actualizaciones = {};

        // Se aplican las actualizaciones solo si los campos existen y son válidos
        if (nombre && typeof nombre === 'string' && nombre.trim() !== '') actualizaciones.nombre = nombre.trim();
        if (descripcion && typeof descripcion === 'string') actualizaciones.descripcion = descripcion.trim();
        if (!isNaN(Number(precio))) actualizaciones.precio = Number(precio);
        if (categoria && typeof categoria === 'string') actualizaciones.categoria = categoria;
        if (subcategoria && typeof subcategoria === 'string') actualizaciones.subcategoria = subcategoria.trim();
        // El stock ahora solo se refiere al stock general del producto
        if (stock !== undefined) actualizaciones.stock = stock;
        if (disponible !== undefined) actualizaciones.disponible = disponible;

        // Lógica para actualizar la imagen si se provee una nueva
        if (req.file) {
            // Eliminar la imagen anterior de Cloudinary si existe
            if (producto.public_id) {
                await cloudinary.uploader.destroy(producto.public_id);
            }
            actualizaciones.imagen = req.file.path;
            actualizaciones.public_id = req.file.filename;
        }

        // Actualizar el producto en la base de datos
        producto = await Producto.findByIdAndUpdate(id, actualizaciones, { new: true });
        // Limpiar caché después de la actualización
        await redisClient.del('productos_todos');
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
        // Es crucial poblar las variaciones para poder acceder a sus public_id
        const producto = await Producto.findById(id).populate('variaciones'); 
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        // --- ✨ ADICIÓN: Eliminación de imágenes de variaciones en Cloudinary ✨ ---
        if (producto.variaciones && producto.variaciones.length > 0) {
            console.log(`🗑️ Preparando para eliminar imágenes de ${producto.variaciones.length} variaciones de Cloudinary.`);
            for (const variacion of producto.variaciones) {
                if (variacion.imagenes && variacion.imagenes.length > 0) {
                    for (const img of variacion.imagenes) {
                        if (img.public_id) {
                            await cloudinary.uploader.destroy(img.public_id);
                            console.log(`   - 🗑️ Imagen de variación eliminada de Cloudinary: ${img.public_id}`);
                        }
                    }
                }
            }
            console.log("👍 Todas las imágenes de variaciones asociadas han sido eliminadas de Cloudinary.");
        }
        // --- FIN DE LA ADICIÓN ---

        // Eliminar la imagen principal del producto de Cloudinary (si existe)
        if (producto.public_id) {
            await cloudinary.uploader.destroy(producto.public_id);
            console.log(`🗑️ Imagen principal del producto eliminada de Cloudinary: ${producto.public_id}`);
        }

        // Eliminar el producto de la base de datos.
        // Si las variaciones son subdocumentos (como se maneja en tu esquema),
        // Mongoose las eliminará automáticamente al eliminar el documento padre.
        await Producto.findByIdAndDelete(id);
        
        // Limpiar caché después de la eliminación
        await redisClient.del('productos_todos');
        console.log(`✅ Producto con ID ${id} y sus variaciones/imágenes eliminados con éxito.`);
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

        if (!['admin', 'superAdmin'].includes(estado)) { // Cambiado para verificar rol si es necesario, o solo estado
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

        // Esta función ahora solo maneja el stock general del producto, no el de variaciones
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