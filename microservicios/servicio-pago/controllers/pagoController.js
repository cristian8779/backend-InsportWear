const boldService = require("../services/boldService");
const carritoService = require("../services/carritoService");
const ventaService = require("../services/ventaService");

exports.confirmarPago = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    if (!orderId || !userId) {
      return res.status(400).json({ mensaje: "Faltan datos requeridos (orderId o userId)." });
    }

    const estado = await boldService.verificarPago(orderId);
    if (estado !== "APPROVED") {
      return res.status(400).json({
        mensaje: "El pago aún no ha sido aprobado.",
        estado: estado.toLowerCase(),
      });
    }

    const { productos, total } = await carritoService.obtenerResumen(userId);
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: "Carrito vacío o no encontrado." });
    }

    const venta = await ventaService.crearVenta({
      usuarioId: userId,
      productos,
      total,
      estadoPago: "approved",
      referenciaPago: orderId,
    });

    await carritoService.vaciarCarrito(userId);

    res.status(201).json({
      mensaje: "Pago confirmado y venta registrada.",
      estado: "approved",
      venta,
    });
  } catch (error) {
    const mensajeError = error?.response?.data?.mensaje || error.message || "Error desconocido";
    console.error("❌ Error en confirmarPago:", mensajeError);
    res.status(500).json({
      mensaje: "Error al confirmar el pago.",
      error: mensajeError,
    });
  }
};
