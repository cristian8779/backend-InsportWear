const Carrito = require('../models/Carrito');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');

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

// 📦 Obtener carrito completo (ENRIQUECIDO)
const obtenerCarrito = async (req, res) => {
  try {
    const userId = req.user._id;
    const carrito = await Carrito.findOne({ usuarioId: userId });

    if (!carrito || carrito.productos.length === 0) {
      return res.status(200).json({ mensaje: 'Tu carrito está vacío por ahora. ¡Agrega algo que te guste!', carrito: [] });
    }

    const productosEnriquecidos = [];

    for (const item of carrito.productos) {
      const producto = await obtenerProductoRemoto(item.productoId);
      if (!producto) continue;

      let variacion = null;
      if (item.variacionId) {
        variacion = producto.variaciones?.find(v => String(v._id) === String(item.variacionId));
        if (!variacion) {
          console.warn(`⚠️ Variación ${item.variacionId} no encontrada en producto ${producto.nombre}`);
        }
      }

      // Precio preferentemente del remoto (o del item si prefieres el guardado)
      const precioBase = variacion ? variacion.precio : producto.precio;

      // Imagen: 1) la guardada en el item, 2) la de la variación, 3) la del producto
      const imagenVariacion = variacion?.imagenes?.[0]?.url;
      const imagen = item.imagen || imagenVariacion || producto.imagen;

      productosEnriquecidos.push({
        productoId: item.productoId,
        variacionId: item.variacionId,
        cantidad: item.cantidad,
        precio: precioBase,
        nombre: producto.nombre,
        imagen, // 👈 mostramos la que decidimos arriba
        atributos: item.atributos || {},
        subtotal: precioBase * item.cantidad
      });
    }

    const total = productosEnriquecidos.reduce((acc, p) => acc + p.subtotal, 0);
    res.json({ productos: productosEnriquecidos, total });
  } catch (err) {
    console.error('❌ Error al obtener el carrito:', err);
    res.status(500).json({ mensaje: 'Tuvimos un problema al cargar tu carrito. Intentá nuevamente más tarde.' });
  }
};




// ➕ Agregar producto al carrito
const agregarAlCarrito = async (req, res) => {
  const { productoId, variacionId, cantidad = 1 } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ mensaje: 'Por favor, seleccioná un producto válido y una cantidad mayor a cero.' });
  }

  try {
    const userId = req.user._id;

    const producto = await obtenerProductoRemoto(productoId);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado.' });
    }

    // Por defecto, precio/imagen del producto principal
    let precio = producto.precio;
    let imagen = producto.imagen;
    let atributos = {};

    // Si viene variación, usar precio e imagen de la variación
    if (variacionId) {
      const variacion = producto.variaciones?.find(v => String(v._id) === String(variacionId));
      if (!variacion) {
        return res.status(404).json({ mensaje: 'Variación no encontrada.' });
      }

      const imagenVariacion = variacion.imagenes?.[0]?.url; // 👈 O la que quieras elegir
      precio = variacion.precio;
      imagen = imagenVariacion || producto.imagen;

      atributos = {
        color: variacion.color || {},
        tallaLetra: variacion.tallaLetra,
        tallaNumero: variacion.tallaNumero,
        imagen: imagenVariacion || null,      // referenciamos la url usada
        imagenes: variacion.imagenes || []    // opcional, por si te sirve guardarlas
      };
    }

    let carrito = await Carrito.findOne({ usuarioId: userId });
    if (!carrito) {
      carrito = new Carrito({ usuarioId: userId, productos: [] });
    }

    // Misma combinación producto + variación => suma cantidades
    const index = carrito.productos.findIndex(p =>
      p.productoId.toString() === productoId &&
      String(p.variacionId || '') === String(variacionId || '')
    );

    if (index >= 0) {
      carrito.productos[index].cantidad += cantidad;

      // Opcional: mantener consistentes precio/imagen si cambian
      carrito.productos[index].precio = precio;
      carrito.productos[index].imagen = imagen;
      carrito.productos[index].atributos = { ...(carrito.productos[index].atributos || {}), ...atributos };
    } else {
      carrito.productos.push({
        productoId,
        variacionId: variacionId || null,
        cantidad,
        precio,
        imagen,     // 👈 guardamos la imagen elegida (variación > producto)
        atributos
      });
    }

    await carrito.save();
    console.log("✅ Carrito actualizado:", JSON.stringify(carrito, null, 2));

    res.status(200).json({ mensaje: 'Producto agregado al carrito con éxito.', carrito });
  } catch (err) {
    console.error('❌ Error al agregar al carrito:', err);
    res.status(500).json({ mensaje: 'No pudimos agregar el producto. Probá de nuevo en unos minutos.' });
  }
};



// 🔁 Actualizar cantidad
const actualizarCantidad = async (req, res) => {
  const { productoId, variacionId, cantidad } = req.body;

  if (!productoId || cantidad < 1) {
    return res.status(400).json({ mensaje: 'La cantidad debe ser al menos 1.' });
  }

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito) return res.status(404).json({ mensaje: 'No encontramos tu carrito.' });

    const producto = carrito.productos.find(p =>
      p.productoId.toString() === productoId &&
      String(p.variacionId || '') === String(variacionId || '')
    );

    if (!producto) return res.status(404).json({ mensaje: 'Este producto no está en tu carrito.' });

    producto.cantidad = cantidad;
    await carrito.save();

    res.status(200).json({ mensaje: 'Cantidad actualizada correctamente.', carrito });
  } catch (err) {
    console.error('❌ Error al actualizar cantidad:', err);
    res.status(500).json({ mensaje: 'No pudimos actualizar la cantidad.' });
  }
};

// 🗑 Eliminar producto
const eliminarDelCarrito = async (req, res) => {
  const { productoId, variacionId } = req.body;

  if (!productoId) {
    return res.status(400).json({ mensaje: 'Necesitamos el ID del producto a eliminar.' });
  }

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user._id });
    if (!carrito) return res.status(404).json({ mensaje: 'No encontramos tu carrito.' });

    carrito.productos = carrito.productos.filter(p =>
      !(p.productoId.toString() === productoId &&
        String(p.variacionId || '') === String(variacionId || ''))
    );

    await carrito.save();
    res.status(200).json({ mensaje: 'Producto eliminado del carrito.', carrito });
  } catch (err) {
    console.error('❌ Error al eliminar producto:', err);
    res.status(500).json({ mensaje: 'No pudimos eliminar el producto.' });
  }
};



// 🧾 Resumen del carrito (ENRIQUECIDO)
const obtenerResumenCarrito = async (req, res) => {
  try {
    const userId = req.params.userId || req.user?._id;
    if (!userId) return res.status(400).json({ mensaje: 'No se encontró información del usuario.' });

    const carrito = await Carrito.findOne({ usuarioId: userId });
    if (!carrito || carrito.productos.length === 0) {
      return res.status(200).json({ mensaje: 'Tu carrito está vacío.', productos: [], total: 0 });
    }

    const resumen = [];

    for (const item of carrito.productos) {
      const producto = await obtenerProductoRemoto(item.productoId);
      if (!producto) continue;

      let variacion = null;
      if (item.variacionId) {
        variacion = producto.variaciones?.find(v => String(v._id) === String(item.variacionId));
      }

      const precioBase = variacion ? variacion.precio : producto.precio;

      // Misma regla de imagen que en obtenerCarrito
      const imagenVariacion = variacion?.imagenes?.[0]?.url;
      const imagen = item.imagen || imagenVariacion || producto.imagen;

      resumen.push({
        productoId: item.productoId,
        variacionId: item.variacionId,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precio: precioBase,
        imagen, // 👈 consistente
        atributos: item.atributos || {},
        subtotal: precioBase * item.cantidad
      });
    }

    const total = resumen.reduce((acc, p) => acc + p.subtotal, 0);
    res.status(200).json({ productos: resumen, total });
  } catch (err) {
    console.error('❌ Error al obtener resumen del carrito:', err);
    res.status(500).json({ mensaje: 'No pudimos generar el resumen.' });
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


const eliminarProductoDeTodosLosCarritos = async (req, res) => {
  try {
    const { productoId } = req.params;

    if (!productoId || !mongoose.Types.ObjectId.isValid(productoId)) {
      return res.status(400).json({ mensaje: 'El ID de producto no es válido.' });
    }

    const resultado = await Carrito.updateMany(
      {},
      { $pull: { productos: { productoId: new mongoose.Types.ObjectId(productoId) } } } // 👈 Convertir a ObjectId
    );

    res.status(200).json({
      mensaje: `Producto eliminado de ${resultado.modifiedCount} carritos.`,
      resultado
    });
  } catch (err) {
    console.error('❌ Error al eliminar producto de todos los carritos:', err);
    res.status(500).json({ mensaje: 'Error eliminando producto de carritos.', error: err.message });
  }
};


module.exports = {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerResumenCarrito,
  vaciarCarrito,
  eliminarProductoDeTodosLosCarritos
};
