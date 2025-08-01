const carritoService = require("../services/carritoService");
const generarFirmaBold = require("../utils/generarFirmaBold");

const generarFirma = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      console.warn("⚠️ userId no proporcionado en el body");
      return res.status(400).json({ mensaje: "Falta userId" });
    }

    console.log("➡️ Obteniendo resumen del carrito para el usuario:", userId);

    // Traemos el total desde el carrito
    const resumen = await carritoService.obtenerResumen(userId);

    if (!resumen || !resumen.total) {
      console.warn("⚠️ Resumen del carrito no válido:", resumen);
      return res.status(404).json({ mensaje: "No se pudo obtener el total del carrito." });
    }

    const amount = resumen.total;
    const currency = "COP";
    const orderId = `orden-${Date.now()}`;
    const secretKey = process.env.BOLD_SECRET_KEY;

    if (!secretKey) {
      console.error("❌ Clave secreta BOLD no encontrada en variables de entorno");
      return res.status(500).json({ mensaje: "Error interno: clave secreta no configurada." });
    }

    console.log("✅ Datos para generar firma:", { orderId, amount, currency });

    const firma = generarFirmaBold({
      orderId,
      amount,
      currency,
      secretKey,
    });

    console.log("✅ Firma generada correctamente:", firma);

    res.status(200).json({ orderId, amount, currency, firma });

  } catch (error) {
    // Captura errores HTTP de Axios
    if (error.response) {
      console.error("❌ Error al contactar microservicio de carrito:");
      console.error("📡 Status:", error.response.status);
      console.error("📝 Data:", error.response.data);
    } else {
      console.error("❌ Error inesperado al generar firma:", error.message);
    }

    res.status(500).json({
      mensaje: "Error al generar la firma.",
      error: error?.response?.data || error.message,
    });
  }
};

module.exports = { generarFirma };
