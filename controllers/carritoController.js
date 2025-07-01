const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');

// Obtener carrito completo del usuario
const obtenerCarrito = async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user.id }).populate('productos.productoId');

    if (!carrito || carrito.productos.length === 0) {
      return res.status(404).json({ message: 'Carrito vacío' });
    }

    res.json(carrito);
  } catch (err) {
    console.error('Error al obtener el carrito:', err);
    res.status(500).json({ message: 'Error en el servidor al obtener el carrito' });
  }
};

// Agregar producto al carrito
const agregarAlCarrito = async (req, res) => {
  const { productoId, talla, color, cantidad } = req.body;

  try {
    let carrito = await Carrito.findOne({ usuarioId: req.user.id });

    if (!carrito) {
      carrito = new Carrito({ usuarioId: req.user.id, productos: [] });
    }

    const index = carrito.productos.findIndex(p =>
      p.productoId.toString() === productoId && p.talla === talla && p.color === color
    );

    if (index >= 0) {
      carrito.productos[index].cantidad += cantidad;
    } else {
      carrito.productos.push({ productoId, talla, color, cantidad });
    }

    await carrito.save();
    res.json(carrito);
  } catch (err) {
    console.error('Error al agregar al carrito:', err);
    res.status(500).json({ message: 'Error en el servidor al agregar al carrito' });
  }
};

// Actualizar cantidad de un producto en el carrito
const actualizarCantidad = async (req, res) => {
  const { productoId, talla, color, cantidad } = req.body;

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user.id });

    if (!carrito) return res.status(404).json({ message: 'Carrito no encontrado' });

    const producto = carrito.productos.find(p =>
      p.productoId.toString() === productoId && p.talla === talla && p.color === color
    );

    if (!producto) return res.status(404).json({ message: 'Producto no encontrado en el carrito' });

    producto.cantidad = cantidad;

    await carrito.save();
    res.json(carrito);
  } catch (err) {
    console.error('Error al actualizar la cantidad:', err);
    res.status(500).json({ message: 'Error en el servidor al actualizar la cantidad' });
  }
};

// Eliminar producto del carrito
const eliminarDelCarrito = async (req, res) => {
  const { productoId, talla, color } = req.body;

  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user.id });

    if (!carrito) return res.status(404).json({ message: 'Carrito no encontrado' });

    carrito.productos = carrito.productos.filter(p =>
      !(p.productoId.toString() === productoId && p.talla === talla && p.color === color)
    );

    await carrito.save();
    res.json(carrito);
  } catch (err) {
    console.error('Error al eliminar del carrito:', err);
    res.status(500).json({ message: 'Error en el servidor al eliminar del carrito' });
  }
};

// Obtener resumen del carrito con subtotales y total
const obtenerResumenCarrito = async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ usuarioId: req.user.id }).populate('productos.productoId');
    if (!carrito || carrito.productos.length === 0) {
      return res.status(404).json({ message: 'Carrito vacío' });
    }

    const resumen = carrito.productos.map(item => {
      const producto = item.productoId;
      let precio = producto.precio;

      const variacion = producto.variaciones.find(v => v.talla === item.talla && v.color === item.color);
      if (variacion && variacion.precio != null) {
        precio = variacion.precio;
      }

      const subtotal = item.cantidad * precio;

      return {
        producto: {
          id: producto._id,
          nombre: producto.nombre,
          talla: item.talla,
          color: item.color,
          precio,
          imagen: variacion?.imagen || producto.imagen || null
        },
        cantidad: item.cantidad,
        subtotal
      };
    });

    const total = resumen.reduce((acc, item) => acc + item.subtotal, 0);

    res.json({ resumen, total });
  } catch (err) {
    console.error('Error al obtener resumen del carrito:', err);
    res.status(500).json({ message: 'Error en el servidor al obtener el resumen del carrito' });
  }
};

module.exports = {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  obtenerResumenCarrito
};
