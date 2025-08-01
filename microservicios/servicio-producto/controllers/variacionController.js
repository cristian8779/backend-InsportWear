const Producto = require('../models/Producto');
const cloudinary = require('../config/cloudinary');

// ---
// 📦 Agregar una variación al producto
// ---
const agregarVariacion = async (req, res) => {
    try {
        const { productoId } = req.params;
        const { tallaNumero, tallaLetra, color, nombreColor, stock, precio } = req.body;

        if (!tallaNumero && !tallaLetra) {
            return res.status(400).json({ mensaje: '⚠️ Se requiere al menos una talla (número o letra).' });
        }

        if (precio === undefined || isNaN(Number(precio)) || Number(precio) < 0) {
            return res.status(400).json({ mensaje: '⚠️ El precio debe ser válido y no negativo.' });
        }

        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        const nuevaVariacion = {
            tallaNumero,
            tallaLetra,
            color,
            nombreColor,
            stock: Number(stock) || 0,
            precio: Number(precio),
            imagenes: [],
        };

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files) {
                nuevaVariacion.imagenes.push({
                    url: file.path,
                    public_id: file.filename,
                });
            }
        }

        producto.variaciones.push(nuevaVariacion);
        producto.stock = 0;

        await producto.save();
        res.status(201).json({ mensaje: '✅ Variación agregada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al agregar variación:", error);
        res.status(500).json({ mensaje: '❌ Error interno al agregar variación.', error: error.message });
    }
};

// ---
// 🔍 Obtener variaciones y generar filtros
// ---
const obtenerVariaciones = async (req, res) => {
    try {
        const { productoId } = req.params;
        const { tallaNumero, tallaLetra, color, nombreColor } = req.query;

        const producto = await Producto.findById(productoId);
        if (!producto) {
            return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });
        }

        let variacionesFiltradas = producto.variaciones;

        if (tallaNumero) {
            variacionesFiltradas = variacionesFiltradas.filter(v => v.tallaNumero === tallaNumero);
        }
        if (tallaLetra) {
            variacionesFiltradas = variacionesFiltradas.filter(v => v.tallaLetra?.toLowerCase() === tallaLetra.toLowerCase());
        }
        if (color) {
            variacionesFiltradas = variacionesFiltradas.filter(v => v.color?.toLowerCase() === color.toLowerCase());
        }
        if (nombreColor) {
            variacionesFiltradas = variacionesFiltradas.filter(v => v.nombreColor?.toLowerCase() === nombreColor.toLowerCase());
        }

        const tallasNumeroSet = new Set();
        const tallasLetraSet = new Set();
        const coloresSet = new Set();
        const nombresColorSet = new Set();
        const subcategoriasSet = new Set();

        if (producto.subcategoria) subcategoriasSet.add(producto.subcategoria);

        producto.variaciones.forEach(v => {
            if (v.tallaNumero) tallasNumeroSet.add(v.tallaNumero);
            if (v.tallaLetra) tallasLetraSet.add(v.tallaLetra.toUpperCase());
            if (v.color) coloresSet.add(v.color.charAt(0).toUpperCase() + v.color.slice(1).toLowerCase());
            if (v.nombreColor) nombresColorSet.add(v.nombreColor.charAt(0).toUpperCase() + v.nombreColor.slice(1).toLowerCase());
        });

        const filtrosDisponibles = {
            tallasNumero: Array.from(tallasNumeroSet).sort((a, b) => a - b).map(String),
            tallasLetra: Array.from(tallasLetraSet).sort(),
            colores: Array.from(coloresSet).sort(),
            nombreColores: Array.from(nombresColorSet).sort(),
            subcategorias: Array.from(subcategoriasSet).sort(),
        };

        res.json({ mensaje: '✅ Variaciones obtenidas con éxito.', variaciones: variacionesFiltradas, filtrosDisponibles });
    } catch (error) {
        console.error("🐛 Error al obtener variaciones:", error);
        res.status(500).json({ mensaje: '❌ Error interno al obtener variaciones.', error: error.message });
    }
};

// ---
// 🗑️ Eliminar variación
// ---
const eliminarVariacion = async (req, res) => {
    try {
        const { productoId, id } = req.params;
        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(id);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        for (const img of variacion.imagenes) {
            if (img.public_id) await cloudinary.uploader.destroy(img.public_id);
        }

        variacion.remove();
        await producto.save();

        res.json({ mensaje: '✅ Variación eliminada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al eliminar variación:", error);
        res.status(500).json({ mensaje: '❌ Error interno al eliminar variación.', error: error.message });
    }
};

// ---
// ✏️ Actualizar variación
// ---
const actualizarVariacion = async (req, res) => {
    try {
        const { productoId, id } = req.params;
        const { tallaNumero, tallaLetra, color, nombreColor, stock, precio, imagenesAEliminar } = req.body;

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(id);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        if (tallaNumero !== undefined) variacion.tallaNumero = tallaNumero;
        if (tallaLetra !== undefined) variacion.tallaLetra = tallaLetra;
        if (color !== undefined) variacion.color = color;
        if (nombreColor !== undefined) variacion.nombreColor = nombreColor;
        if (stock !== undefined) variacion.stock = Number(stock);
        if (precio !== undefined) {
            if (isNaN(Number(precio)) || Number(precio) < 0) {
                return res.status(400).json({ mensaje: '⚠️ Precio inválido.' });
            }
            variacion.precio = Number(precio);
        }

        if (imagenesAEliminar && Array.isArray(imagenesAEliminar)) {
            for (const public_id of imagenesAEliminar) {
                const index = variacion.imagenes.findIndex(img => img.public_id === public_id);
                if (index > -1) {
                    await cloudinary.uploader.destroy(public_id);
                    variacion.imagenes.splice(index, 1);
                }
            }
        }

        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                variacion.imagenes.push({
                    url: file.path,
                    public_id: file.filename,
                });
            }
        }

        await producto.save();
        res.json({ mensaje: '✅ Variación actualizada con éxito.', producto });
    } catch (error) {
        console.error("🐛 Error al actualizar variación:", error);
        res.status(500).json({ mensaje: '❌ Error interno al actualizar variación.', error: error.message });
    }
};

// ---
// 📉 Reducir stock de una variación
// ---
const reducirStockVariacion = async (req, res) => {
    try {
        const { cantidad } = req.body;
        const { productoId, id } = req.params;

        const producto = await Producto.findById(productoId);
        if (!producto) return res.status(404).json({ mensaje: '🚫 Producto no encontrado.' });

        const variacion = producto.variaciones.id(id);
        if (!variacion) return res.status(404).json({ mensaje: '⚠️ Variación no encontrada.' });

        if (variacion.stock < cantidad) {
            return res.status(400).json({ mensaje: `⚠️ Stock insuficiente. Solo hay ${variacion.stock} unidades.` });
        }

        variacion.stock -= cantidad;
        await producto.save();

        res.json({ mensaje: '✅ Stock reducido con éxito.', variacion });
    } catch (error) {
        console.error("🐛 Error al reducir stock:", error);
        res.status(500).json({ mensaje: '❌ Error interno al reducir stock.', error: error.message });
    }
};

module.exports = {
    agregarVariacion,
    obtenerVariaciones,
    eliminarVariacion,
    actualizarVariacion,
    reducirStockVariacion,
};
