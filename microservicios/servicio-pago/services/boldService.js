const axios = require("axios");

const BOLD_API_URL = "https://payments.api.bold.co/v2/payment-voucher";
const BOLD_API_KEY = process.env.BOLD_SECRET_KEY; // 🔹 Cambiado para coincidir con tu .env

// services/boldService.js
exports.verificarPago = async (orderId) => {
  // ⚡ Si es un orderId de prueba, simulamos que está aprobado
  if (orderId && orderId.startsWith("test_")) {
    console.log(`🧪 Simulación de pago aprobado para orderId=${orderId}`);
    return "approved"; // o "pending"/"failed" si quieres probar otros escenarios
  }

  // 🔹 Lógica real de Bold
  try {
    const res = await axios.get(`${BOLD_API_URL}/${orderId}`, {
      headers: { "x-api-key": BOLD_API_KEY },
    });
    return res.data?.payment?.status || "unknown";
  } catch (error) {
    console.error("❌ Error al verificar pago con Bold:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return "unknown";
  }
};

