// controllers/pagoController.js
const boldService = require("../services/boldService");
const carritoService = require("../services/carritoService");
const productoService = require("../services/productoService"); 
const variacionService = require("../services/variacionService");
const ventaService = require("../services/ventaService"); 
const axios = require("axios");

const URL_USUARIO = process.env.URL_MICROSERVICIO_USUARIO;

// 🔄 Obtener usuario por ID desde microservicio
const obtenerUsuarioPorId = async (id, token = null) => {
  try {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const { data } = await axios.get(`${URL_USUARIO}/${id}`, { headers });
    if (data?.usuario) return data.usuario;
    if (data?.data) return data.data;
    return data;
  } catch (error) {
    console.error(`❌ Error al obtener usuario (${id}):`, error.response?.data || error.message);
    throw new Error("Usuario no encontrado");
  }
};


// Traducción de estados Bold a español
const traducirEstadoPago = (estado) => {
  switch ((estado || "").toLowerCase()) {
    case "approved": return "aprobado";
    case "pending": return "pendiente";
    case "failed": return "fallido";
    case "canceled":
    case "cancelled": return "cancelado";
    default: return "desconocido";
  }
};

exports.confirmarPago = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { orderId } = req.body;

    if (!orderId || !userId) {
      return res.status(400).json({ mensaje: "Faltan datos requeridos (orderId o userId)." });
    }

    // 1. Verificar el pago en Bold
    const estadoBold = await boldService.verificarPago(orderId);
    const estado = estadoBold?.toLowerCase();

    // 2. Buscar venta pendiente
    let venta = await ventaService.buscarPorReferencia(orderId, userId);

    if (estado !== "approved") {
      // Si no existe, creamos una venta mínima pendiente
      if (!venta) {
        venta = await ventaService.crearVenta({
          usuarioId: userId,
          productos: [],
          total: 0,
          estadoPago: "pending",
          referenciaPago: orderId,
        });
      }
      return res.status(400).json({
        mensaje: "El pago aún no ha sido aprobado.",
        estado: traducirEstadoPago(estado),
        venta,
      });
    }

    // 3. Obtener el resumen del carrito
    const { productos, total } = await carritoService.obtenerResumen(userId);
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: "Carrito vacío o no encontrado." });
    }

    // 4. Reducir stock
    for (const item of productos) {
      try {
        if (item.variacionId) {
          await variacionService.reducirStock(item.productoId, item.variacionId, item.cantidad);
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

   // 5. Obtener datos del usuario
const usuario = await obtenerUsuarioPorId(userId);

// 6. Crear la venta aprobada
venta = await ventaService.crearVenta({
  usuarioId: userId,
  productos,
  total,
  estadoPago: "approved", // debe ser exacto
  referenciaPago: orderId,
  nombreUsuario: usuario?.nombre || "Desconocido", // siempre string
  telefonoUsuario: usuario?.telefono || "",
  direccionUsuario: usuario?.direccion ? JSON.stringify(usuario.direccion) : "",

  desdePago: true,
});

    // 7. Vaciar carrito
    await carritoService.vaciarCarrito(userId);

    // 8. Respuesta final
    res.status(201).json({
      mensaje: "✅ Pago confirmado, stock actualizado, venta creada y carrito vaciado.",
      estado: traducirEstadoPago(estado),
      total,
      venta,
    });

  } catch (error) {
    const mensajeError = error?.response?.data?.mensaje || error.message || "Error desconocido";
    console.error("❌ Error en confirmarPago:", mensajeError);
    res.status(500).json({ mensaje: "Error al confirmar el pago.", error: mensajeError });
  }
};
