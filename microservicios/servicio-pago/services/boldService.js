const axios = require("axios");

const BOLD_API_URL = "https://payments.api.bold.co/v2/payment-voucher";
const BOLD_API_KEY = process.env.BOLD_SECRET_KEY; // 🔹 Cambiado para coincidir con tu .env

exports.verificarPago = async (orderId) => {
  if (!orderId) {
    console.warn("⚠️ orderId no proporcionado a verificarPago()");
    return "unknown";
  }

  if (!BOLD_API_KEY) {
    console.error("❌ BOLD_API_KEY no configurada en variables de entorno.");
    return "unknown";
  }

  try {
    const res = await axios.get(`${BOLD_API_URL}/${orderId}`, {
      headers: {
        "x-api-key": BOLD_API_KEY,
      },
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
