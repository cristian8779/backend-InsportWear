const carritoService = require("../services/carritoService");
const generarFirmaBold = require("../utils/generarFirmaBold");

const generarFirma = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      console.warn("⚠️ userId no proporcionado en el body");
      return res.status(400).json({
        mensaje: "No pudimos identificar tu usuario. Intenta volver a iniciar sesión.",
      });
    }

    console.log("➡️ Obteniendo resumen del carrito para el usuario:", userId);
    const resumen = await carritoService.obtenerResumen(userId);

    if (!resumen || typeof resumen.total !== "number") {
      console.warn("⚠️ Total inválido en resumen del carrito:", resumen);
      return res.status(404).json({
        mensaje: "Hubo un problema al calcular el total de tu carrito. Por favor intenta nuevamente.",
      });
    }

    if (resumen.total <= 0 || !Array.isArray(resumen.productos) || resumen.productos.length === 0) {
      console.warn("⚠️ Carrito vacío o sin productos válidos:", resumen);
      return res.status(400).json({
        mensaje: "Tu carrito está vacío. Agrega productos antes de continuar con el pago.",
      });
    }

    const amount = Number(resumen.total);
    const currency = "COP";
    const orderId = `orden-${Date.now()}`;
    const secretKey = process.env.BOLD_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ Clave secreta BOLD no definida en variables de entorno.");
      throw new Error("La configuración del sistema es incorrecta. Falta la clave secreta.");
    }

    console.log("🔐 Generando firma con:", { orderId, amount, currency });
    const firma = generarFirmaBold({ orderId, amount, currency, secretKey });
    console.log("✅ Firma generada:", firma);

    return res.status(200).json({
      orderId,
      amount,
      currency,
      firma,
    });

  } catch (error) {
    if (error.response) {
      console.error("❌ Error HTTP al contactar microservicio:");
      console.error("📡 Status:", error.response.status);
      console.error("📝 Data:", error.response.data);
    } else {
      console.error("❌ Error interno al generar firma:", error.message);
    }

    return res.status(500).json({
      mensaje: "Ocurrió un error inesperado al intentar generar tu pago. Por favor intenta nuevamente en unos segundos.",
      error: error?.response?.data || error.message,
    });
  }
};

module.exports = { generarFirma };
