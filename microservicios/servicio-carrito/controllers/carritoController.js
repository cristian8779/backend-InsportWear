const Carrito = require('../models/Carrito');
const axios = require('axios');
require('dotenv').config();

const PRODUCTO_SERVICE_URL = process.env.PRODUCTO_SERVICE_URL;

// 🔍 Consultar producto en microservicio de productos
const obtenerProductoRemoto = async (productoId) => {
  try {
    if (!PRODUCTO_SERVICE_URL) {
      console.error("❌ PRODUCTO_SERVICE_URL no definido");
      return null;
    }

    const url = `${PRODUCTO_SERVICE_URL}/api/productos/${productoId}`;
    const response = await axios.get(url);
    return response.data?.producto || null;
  } catch (error) {
    console.warn(`⚠️ Producto ${productoId} no encontrado o error de servicio:`, error.message);
    return null;
  }
};

// 📦 Obtener carrito completo
const obtenerCarrito = async (req, res) => {
  try {
    const userId = req.user._id;
    const carrito = await Carrito.findOne({ usuarioId: userId });

    if (!carrito || carrito.productos.length === 0) {
      return res.status(200).json({ mensaje: 'Tu carrito está vacío por ahora. ¡Agrega algo que te guste!', carrito: null });
    }

    res.json(carrito);
  } catch (err) {
    console.error('❌ Error al obtener el carrito:', err);
    res.status(500).json({ mensaje: 'Tuvimos un problema al cargar tu carrito. Intentá nuevamente más tarde.' });
  }
};

// ➕ Agregar producto al carrito
const agregarAlCarrito = async (req, res) => {
  const { productoId, cantidad = 1 } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ mensaje: 'Por favor, seleccioná un producto válido y una cantidad mayor a cero.' });
  }

  try {
    const userId = req.user._id;
    let carrito = await Carrito.findOne({ usuarioId: userId });

    if (!carrito) {
      carrito = new Carrito({ usuarioId: userId, productos: [] });
    }

    const index = carrito.productos.findIndex(p => p.productoId.toString() === productoId);
    if (index >= 0) {
      carrito.productos[index].cantidad += cantidad;
    } else {
      carrito.productos.push({ productoId, cantidad });
    }

    await carrito.save();
    res.status(200).json({ mensaje: 'Producto agregado al carrito con éxito.', carrito });
  } catch (err) {
    console.error('❌ Error al agregar al carrito:', err);
    res.status(500).json({ mensaje: 'No pudimos agregar el producto. Probá de nuevo en unos minutos.' });
  }
};

// 🔁 Actualizar cantidad
const actualizarCantidad = async (req, res) => {
  const { productoId, cantidad } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser al menos 1. Verificá tu selección.' });
  }

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito) return res.status(404).json({ mensaje: 'No encontramos tu carrito. ¿Querés crear uno nuevo?' });

    const producto = carrito.productos.find(p => p.productoId.toString() === productoId);
    if (!producto) return res.status(404).json({ mensaje: 'Este producto no está en tu carrito.' });

    producto.cantidad = cantidad;
    await carrito.save();

    res.status(200).json({ mensaje: 'Cantidad actualizada correctamente.', carrito });
  } catch (err) {
    console.error('❌ Error al actualizar cantidad:', err);
    res.status(500).json({ mensaje: 'No pudimos actualizar la cantidad. Intentá más tarde.' });
  }
};

// 🗑 Eliminar producto
const eliminarDelCarrito = async (req, res) => {
  const { productoId } = req.body;

  if (!productoId) {
    return res.status(400).json({ mensaje: 'Necesitamos el ID del producto a eliminar.' });
  }

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito) return res.status(404).json({ mensaje: 'No encontramos tu carrito.' });

    const index = carrito.productos.findIndex(p => p.productoId.toString() === productoId);
    if (index === -1) {
      return res.status(404).json({ mensaje: 'Este producto no estaba en tu carrito.' });
    }

    carrito.productos.splice(index, 1);
    await carrito.save();

    res.status(200).json({ mensaje: 'Producto eliminado del carrito.', carrito });
  } catch (err) {
    console.error('❌ Error al eliminar producto:', err);
    res.status(500).json({ mensaje: 'No pudimos eliminar el producto. Intentá más tarde.' });
  }
};

// 🧾 Resumen del carrito
const obtenerResumenCarrito = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) return res.status(400).json({ mensaje: 'No se encontró información del usuario.' });

    const carrito = await Carrito.findOne({ usuarioId: userId });
    if (!carrito || carrito.productos.length === 0) {
      return res.status(200).json({ mensaje: 'Tu carrito está vacío.', productos: [], total: 0 });
    }

    const resumen = await Promise.all(
      carrito.productos.map(async (item) => {
        const producto = await obtenerProductoRemoto(item.productoId);
        if (!producto) return null;

        return {
          producto: {
            id: producto._id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen || null
          },
          cantidad: item.cantidad,
          subtotal: producto.precio * item.cantidad
        };
      })
    );

    const productosValidos = resumen.filter(Boolean);

    // ⚠️ Limpiar productos inexistentes
    const productoIdsValidos = new Set(productosValidos.map(p => p.producto.id.toString()));
    carrito.productos = carrito.productos.filter(p => productoIdsValidos.has(p.productoId.toString()));
    await carrito.save();

    if (!productosValidos.length) {
      return res.status(200).json({ mensaje: 'Todos los productos de tu carrito ya no están disponibles.', productos: [], total: 0 });
    }

    const total = productosValidos.reduce((acc, p) => acc + p.subtotal, 0);
    res.status(200).json({ productos: productosValidos, total });
  } catch (err) {
    console.error('❌ Error al obtener resumen del carrito:', err);
    res.status(500).json({ mensaje: 'No pudimos generar el resumen. Probá más tarde.' });
  }
};

// 🧹 Vaciar carrito
const vaciarCarrito = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) return res.status(400).json({ mensaje: 'No se encontró información del usuario.' });

    const carrito = await Carrito.findOne({ usuarioId: userId });
    if (!carrito) {
      return res.status(404).json({ mensaje: 'No encontramos tu carrito para vaciar.' });
    }

    carrito.productos = [];
    await carrito.save();

    res.status(200).json({ mensaje: 'Carrito vaciado. ¡Listo para empezar de nuevo!' });
  } catch (err) {
    console.error('❌ Error al vaciar carrito:', err);
    res.status(500).json({ mensaje: 'No pudimos vaciar tu carrito. Intentá más tarde.' });
  }
};

module.exports = {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerResumenCarrito,
  vaciarCarrito
};
