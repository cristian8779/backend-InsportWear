const carritoService = require("../services/carritoService");
const generarFirmaBold = require("../utils/generarFirmaBold");

const generarFirma = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || typeof userId !== "string") {
      console.warn("⚠️ userId no proporcionado o inválido en el body:", userId);
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

    const amount = String(Math.round(Number(resumen.total)));
    const currency = "COP";
    const orderId = `orden-${Date.now()}`;
    const secretKey = process.env.BOLD_SECRET_KEY;

    if (!secretKey || typeof secretKey !== "string") {
      console.error("❌ Clave secreta BOLD no definida o inválida.");
      return res.status(500).json({
        mensaje: "Falta la clave secreta de Bold en la configuración del servidor.",
      });
    }

    console.log("🔐 Generando firma con:", { orderId, amount, currency });

    const firma = generarFirmaBold({
      orderId,
      amount,
      currency,
      secretKey,
    });

    if (!firma || typeof firma !== "string") {
      console.error("❌ Firma generada inválida:", firma);
      return res.status(500).json({
        mensaje: "No se pudo generar la firma de integridad correctamente.",
      });
    }

    console.log("✅ Firma generada:", firma);

    return res.status(200).json({
      orderId,
      amount,
      currency,
      firma,
    });

  } catch (error) {
    console.error("❌ Error en generarFirma:", error);

    if (error.response) {
      console.error("📡 Status:", error.response.status);
      console.error("📝 Data:", error.response.data);
    }

    return res.status(500).json({
      mensaje: "Ocurrió un error inesperado al intentar generar tu pago. Por favor intenta nuevamente en unos segundos.",
      error: error?.response?.data || error.message || "Error interno",
    });
  }
};

module.exports = { generarFirma };
