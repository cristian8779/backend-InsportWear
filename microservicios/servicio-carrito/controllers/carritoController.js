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
    console.error(`❌ Error al obtener producto ${productoId}:`, error.message);
    return null;
  }
};

// 📦 Obtener carrito completo
const obtenerCarrito = async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito || carrito.productos.length === 0) {
      return res.status(404).json({ mensaje: 'Tu carrito está vacío.' });
    }

    res.json(carrito);
  } catch (err) {
    console.error('❌ Error al obtener el carrito:', err);
    res.status(500).json({ mensaje: 'Error al cargar tu carrito.' });
  }
};

// ➕ Agregar producto al carrito
const agregarAlCarrito = async (req, res) => {
  const { productoId, cantidad = 1 } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ mensaje: 'Producto inválido o cantidad menor a 1.' });
  }

  try {
    let carrito = await Carrito.findOne({ usuarioId: req.user._id });

    if (!carrito) {
      carrito = new Carrito({ usuarioId: req.user._id, productos: [] });
    }

    const index = carrito.productos.findIndex(p => p.productoId.toString() === productoId);

    if (index >= 0) {
      carrito.productos[index].cantidad += cantidad;
    } else {
      carrito.productos.push({ productoId, cantidad });
    }

    await carrito.save();
    res.status(200).json({ mensaje: '✅ Producto agregado.', carrito });
  } catch (err) {
    console.error('❌ Error al agregar al carrito:', err);
    res.status(500).json({ mensaje: 'No se pudo agregar el producto.' });
  }
};

// 🔁 Actualizar cantidad
const actualizarCantidad = async (req, res) => {
  const { productoId, cantidad } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ mensaje: 'Producto inválido o cantidad menor a 1.' });
  }

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito) return res.status(404).json({ mensaje: 'Carrito no encontrado.' });

    const producto = carrito.productos.find(p => p.productoId.toString() === productoId);
    if (!producto) return res.status(404).json({ mensaje: 'Producto no está en el carrito.' });

    producto.cantidad = cantidad;
    await carrito.save();

    res.status(200).json({ mensaje: '✅ Cantidad actualizada.', carrito });
  } catch (err) {
    console.error('❌ Error al actualizar cantidad:', err);
    res.status(500).json({ mensaje: 'Error al actualizar el producto.' });
  }
};

// 🗑 Eliminar producto
const eliminarDelCarrito = async (req, res) => {
  const { productoId } = req.body;

  if (!productoId) {
    return res.status(400).json({ mensaje: 'Falta productoId.' });
  }

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito) return res.status(404).json({ mensaje: 'Carrito no encontrado.' });

    const cantidadInicial = carrito.productos.length;
    carrito.productos = carrito.productos.filter(p => p.productoId.toString() !== productoId);

    if (carrito.productos.length === cantidadInicial) {
      return res.status(404).json({ mensaje: 'El producto no estaba en tu carrito.' });
    }

    await carrito.save();
    res.status(200).json({ mensaje: '🗑 Producto eliminado.', carrito });
  } catch (err) {
    console.error('❌ Error al eliminar producto:', err);
    res.status(500).json({ mensaje: 'Error al eliminar el producto.' });
  }
};

// 🧾 Resumen del carrito (token o userId por parámetro)
const obtenerResumenCarrito = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) return res.status(400).json({ mensaje: 'Falta userId.' });

    const carrito = await Carrito.findOne({ usuarioId: userId });
    if (!carrito || carrito.productos.length === 0) {
      return res.status(404).json({ mensaje: 'El carrito está vacío.' });
    }

    const resumen = await Promise.all(
      carrito.productos.map(async (item) => {
        const producto = await obtenerProductoRemoto(item.productoId);
        if (!producto) return null;

        const subtotal = producto.precio * item.cantidad;
        return {
          producto: {
            id: producto._id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen || null
          },
          cantidad: item.cantidad,
          subtotal
        };
      })
    );

    const productosValidos = resumen.filter(Boolean);
    if (!productosValidos.length) {
      return res.status(404).json({ mensaje: 'No se pudo generar el resumen. Todos los productos fallaron.' });
    }

    const total = productosValidos.reduce((acc, p) => acc + p.subtotal, 0);
    res.status(200).json({ productos: productosValidos, total });
  } catch (err) {
    console.error('❌ Error al obtener resumen del carrito:', err);
    res.status(500).json({ mensaje: 'Error al generar el resumen.' });
  }
};

// 🧹 Vaciar carrito (por userId en token o param)
const vaciarCarrito = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) return res.status(400).json({ mensaje: 'Falta userId.' });

    const carrito = await Carrito.findOne({ usuarioId: userId });
    if (!carrito) {
      return res.status(404).json({ mensaje: 'Carrito no encontrado.' });
    }

    carrito.productos = [];
    await carrito.save();

    res.status(200).json({ mensaje: '🧹 Carrito vaciado correctamente.' });
  } catch (err) {
    console.error('❌ Error al vaciar carrito:', err);
    res.status(500).json({ mensaje: 'Error al vaciar el carrito.' });
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
