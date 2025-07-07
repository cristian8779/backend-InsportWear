const carritoService = require("../services/carritoService");

const generarFirma = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ mensaje: "Falta userId" });

    // Traemos el total desde el carrito
    const resumen = await carritoService.obtenerResumen(userId);
    const amount = resumen.total;
    const currency = "COP";
    const orderId = `orden-${Date.now()}`;
    const secretKey = process.env.BOLD_SECRET_KEY;

    const firma = require("../utils/generarFirmaBold")({
      orderId,
      amount,
      currency,
      secretKey,
    });

    res.status(200).json({ orderId, amount, currency, firma });
  } catch (error) {
    console.error("❌ Error al generar firma:", error.message);
    res.status(500).json({ mensaje: "Error al generar la firma.", error: error.message });
  }
};
