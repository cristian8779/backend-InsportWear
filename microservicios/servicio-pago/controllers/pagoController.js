// controllers/pagoController.js
const boldService = require("../services/boldService");
const carritoService = require("../services/carritoService");
const productoService = require("../services/productoService"); // productos base
const variacionService = require("../services/variacionService"); // variaciones
const ventaService = require("../services/ventaService"); // ventas

// Traducción de estados Bold a español
const traducirEstadoPago = (estado) => {
  switch ((estado || "").toLowerCase()) {
    case "approved":
      return "aprobado";
    case "pending":
      return "pendiente";
    case "failed":
      return "fallido";
    case "canceled":
    case "cancelled":
      return "cancelado";
    default:
      return "desconocido";
  }
};

exports.confirmarPago = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { orderId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({
        mensaje: "Faltan datos requeridos (orderId o userId).",
      });
    }

    // 1. Verificar el pago en Bold
    const estadoBold = await boldService.verificarPago(orderId);
    const estado = estadoBold?.toLowerCase();

    if (estado !== "approved") {
      return res.status(400).json({
        mensaje: "El pago aún no ha sido aprobado.",
        estado: traducirEstadoPago(estado),
      });
    }

    // 2. Obtener el resumen del carrito
    const { productos, total } = await carritoService.obtenerResumen(userId);
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: "Carrito vacío o no encontrado." });
    }

    // 3. Reducir stock correctamente
    for (const item of productos) {
      try {
        if (item.variacionId) {
          await variacionService.reducirStock(
            item.productoId,
            item.variacionId,
            item.cantidad
          );
        } else {
          await productoService.reducirStock(item.productoId, item.cantidad);
        }
      } catch (stockError) {
        return res.status(400).json({
          mensaje: `Stock insuficiente para el producto ${item.productoId}${item.variacionId ? " (variación " + item.variacionId + ")" : ""}.`,
          error: stockError.message || stockError,
        });
      }
    }

    // 4. Crear la venta (desde pago, no requiere adminManual)
    const venta = await ventaService.crearVenta({
      usuarioId: userId,
      productos,
      total,
      estadoPago: "approved",
      referenciaPago: orderId,
      desdePago: true, // 🔹 Indica que viene del microservicio de pagos
    });

    // 5. Vaciar carrito
    await carritoService.vaciarCarrito(userId);

    // 6. Respuesta final
    res.status(201).json({
      mensaje: "✅ Pago confirmado, stock actualizado, venta creada y carrito vaciado.",
      estado: traducirEstadoPago(estado),
      total,
      venta,
    });
  } catch (error) {
    const mensajeError =
      error?.response?.data?.mensaje || error.message || "Error desconocido";
    console.error("❌ Error en confirmarPago:", mensajeError);
    res.status(500).json({
      mensaje: "Error al confirmar el pago.",
      error: mensajeError,
    });
  }
};
