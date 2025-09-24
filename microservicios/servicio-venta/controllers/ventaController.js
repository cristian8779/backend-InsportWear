// controllers/ventaController.js
const Venta = require("../models/Venta");
const { obtenerProductoPorId } = require("../utils/servicioProducto");
const expandirVentas = require("../utils/expandirVentas");
const { DateTime } = require("luxon");
const axios = require("axios");

// Construir filtro para consultas admin
const construirFiltroVentas = ({ fechaInicio, fechaFin, estado }) => {
  const filtro = {};
  if (fechaInicio || fechaFin) {
    filtro.fecha = {};
    if (fechaInicio) filtro.fecha.$gte = DateTime.fromISO(fechaInicio).startOf("day").toJSDate();
    if (fechaFin) filtro.fecha.$lte = DateTime.fromISO(fechaFin).endOf("day").toJSDate();
  }
  if (estado) filtro.estado = estado;
  return filtro;
};

// 1️⃣ Crear venta en estado "pending"
exports.crearVentaPendiente = async (req, res) => {
  try {
    const { usuarioId, productos, total, referenciaPago } = req.body;
    if (!usuarioId || !Array.isArray(productos) || productos.length === 0 || !total || !referenciaPago)
      return res.status(400).json({ mensaje: "Datos incompletos o inválidos para crear la venta." });

    const usuario = await obtenerUsuarioPorId(usuarioId);

    const nuevaVenta = new Venta({
      usuarioId,
      productos,
      total,
      referenciaPago,
      estadoPago: "pending",
      nombreUsuario: usuario?.nombre || "Desconocido",
      telefonoUsuario: usuario?.telefono || "",
      direccionUsuario: usuario?.direccion || {}
    });

    await nuevaVenta.save();

    res.status(201).json({
      mensaje: "✅ Venta creada en estado pendiente. Esperando confirmación de pago.",
      venta: nuevaVenta
    });
  } catch (error) {
    console.error("❌ Error al crear venta pendiente:", error.message);
    res.status(500).json({ mensaje: "No se pudo crear la venta. Intentá más tarde." });
  }
};

// 2️⃣ Confirmar pago y actualizar estado de la venta
exports.confirmarPago = async (req, res) => {
  try {
    const { referenciaPago, estadoPagoBold } = req.body;
    if (!referenciaPago || !estadoPagoBold) return res.status(400).json({ mensaje: "Faltan datos para confirmar el pago." });

    const venta = await Venta.findOne({ referenciaPago });
    if (!venta) return res.status(404).json({ mensaje: "No se encontró una venta con esa referencia." });

    venta.estadoPago = estadoPagoBold === "approved" ? "approved" : "failed";
    await venta.save();

    res.json({
      mensaje: estadoPagoBold === "approved" ? "✅ Pago aprobado y venta finalizada." : "⚠️ Pago fallido. Venta marcada como failed.",
      venta
    });
  } catch (error) {
    console.error("❌ Error al confirmar pago:", error.message);
    res.status(500).json({ mensaje: "No se pudo confirmar el pago. Intentá más tarde." });
  }
};

// 3️⃣ Buscar venta por referencia
exports.buscarPorReferencia = async (req, res) => {
  try {
    const { referenciaPago } = req.params;
    const { usuarioId } = req.query;
    if (!referenciaPago) return res.status(400).json({ mensaje: "Debe proporcionar una referencia de pago." });

    const filtro = { referenciaPago };
    if (usuarioId) filtro.usuarioId = usuarioId;

    const venta = await Venta.findOne(filtro);
    if (!venta) return res.status(404).json({ mensaje: "No se encontró una venta con esa referencia." });

    res.json(venta);
  } catch (error) {
    console.error("❌ Error al buscar venta por referencia:", error.message);
    res.status(500).json({ mensaje: "Error al buscar venta por referencia." });
  }
};

// 📦 Crear venta desde microservicio de pagos (corregido)
exports.crearVentaDesdePago = async (req, res) => {
  try {
    const { usuarioId, productos, total, referenciaPago } = req.body;
    if (!usuarioId || !productos?.length || !total || !referenciaPago)
      return res.status(400).json({ mensaje: "Faltan datos requeridos para registrar la venta." });

    // 🔹 Procesar productos sin reducir stock
    const productosLimpios = await Promise.all(
      productos.map(async (p) => {
        const productoId =
          typeof p.productoId === "object"
            ? p.productoId._id?.toString() || p.productoId.toString()
            : p.productoId;

        if (!productoId) throw new Error("ProductoId inválido en venta.");

        let nombreProducto = "Producto eliminado";
        let talla = p.talla || null;
        let color = p.color || null;
        let precioUnitario = p.precioUnitario || p.precio || 0; // Usar p.precio como fallback
        let imagen = null;

        try {
          const producto = await obtenerProductoPorId(productoId);
          nombreProducto = p.nombre || producto?.nombre?.trim() || nombreProducto; // Priorizar p.nombre

          // 🔥 PRIORIDAD 1: Si viene variacionId, buscar la imagen de la variación
          if (p.variacionId && producto.variaciones?.length) {
            const variacion = producto.variaciones.find(
              (v) => v._id.toString() === p.variacionId.toString()
            );
            if (variacion) {
              // Usar datos de la variación
              talla = variacion.tallaLetra || variacion.tallaNumero || p.atributos?.tallaLetra || null;
              color = variacion.color || p.atributos?.color || null;
              precioUnitario = variacion.precio || p.precio || producto.precio || 0;
              
              // 🔥 IMAGEN DE LA VARIACIÓN (prioridad máxima)
              imagen = variacion.imagen || p.atributos?.imagen || null;
            }
          }

          // 🔥 PRIORIDAD 2: Si no hay imagen de variación, usar la enviada desde el frontend
          if (!imagen && p.imagen) {
            imagen = p.imagen;
          }

          // 🔥 PRIORIDAD 3: Si no hay ninguna, usar la del producto base
          if (!imagen) {
            imagen = producto.imagen || producto.imagenes?.[0] || null;
          }

        } catch (err) {
          console.warn(`⚠️ Producto no encontrado (${productoId}): ${err.message}`);
          
          // Si no se pudo obtener el producto, usar datos enviados desde el frontend
          nombreProducto = p.nombre || nombreProducto;
          precioUnitario = p.precio || precioUnitario;
          imagen = p.atributos?.imagen || p.imagen || null;
          talla = p.atributos?.tallaLetra || null;
          color = p.atributos?.color || null;
        }

        return {
          productoId,
          variacionId: p.variacionId || null,
          nombreProducto,
          imagen, // Esta debería ser la imagen correcta de la variación
          talla,
          color,
          cantidad: p.cantidad || 0,
          precioUnitario,
        };
      })
    );

    const nuevaVenta = new Venta({
      usuarioId,
      productos: productosLimpios,
      total,
      estadoPago: "approved",
      referenciaPago,
      nombreUsuario: req.body.nombreUsuario || "Desconocido",
      telefonoUsuario: req.body.telefonoUsuario || "",
      direccionUsuario: req.body.direccionUsuario ? JSON.stringify(req.body.direccionUsuario) : ""
    });

    await nuevaVenta.save();

    console.log("🔍 Productos guardados en la venta:", productosLimpios.map(p => ({
      nombre: p.nombreProducto,
      variacionId: p.variacionId,
      imagen: p.imagen
    })));

    res.status(201).json({
      mensaje: "✅ Venta creada exitosamente desde microservicio de pagos.",
      venta: nuevaVenta
    });
  } catch (error) {
    console.error("❌ Error en crearVentaDesdePago:", error);
    res.status(500).json({
      mensaje: "Error al registrar la venta desde el microservicio de pagos.",
      error: error.message
    });
  }
};

// 👤 Ventas del usuario autenticado
exports.obtenerVentasUsuario = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    let ventas = await Venta.find({ usuarioId }).sort({ fecha: -1 });
    if (!ventas.length) return res.status(404).json({ mensaje: "Aún no has realizado ninguna venta." });

    ventas = await expandirVentas(ventas);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener tus ventas.", error: error.message });
  }
};

// 📊 Todas las ventas con filtros (Admin)
exports.obtenerTodasLasVentas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, usuarioId, producto, estado } = req.query;
    const filtro = construirFiltroVentas({ fechaInicio, fechaFin, estado });

    let ventas = await Venta.find(filtro).sort({ fecha: -1 });

    if (usuarioId) ventas = ventas.filter(v => v.usuarioId?.toString() === usuarioId);
    if (producto) ventas = ventas.filter(v => v.productos.some(p => p.nombreProducto?.toLowerCase().includes(producto.toLowerCase())));
    if (!ventas.length) return res.status(404).json({ mensaje: "No hay ventas con los filtros seleccionados." });

    ventas = await expandirVentas(ventas);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al consultar las ventas.", error: error.message });
  }
};

// 🗑️ Eliminar venta (Admin)
exports.eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const ventaEliminada = await Venta.findByIdAndDelete(id);
    if (!ventaEliminada) return res.status(404).json({ mensaje: "Venta no encontrada." });

    res.json({ mensaje: "Venta eliminada correctamente.", venta: ventaEliminada });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar la venta.", error: error.message });
  }
};
