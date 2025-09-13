const axios = require("axios");

const BOLD_API_URL = "https://payments.api.bold.co/v2/payment-voucher";
const BOLD_API_KEY = process.env.BOLD_API_KEY;

/**
 * Verifica el estado de un pago en Bold
 * @param {string} orderId - ID de la orden en Bold
 * @returns {Promise<string>} - Estado del pago: APPROVED | PENDING | UNKNOWN
 */
exports.verificarPago = async (orderId) => {
  if (!orderId) {
    console.warn("⚠️ orderId no proporcionado a verificarPago()");
    return "UNKNOWN";
  }

  // 🧪 Modo prueba: si el orderId empieza con "prueba", no llamamos a Bold
  if (orderId.startsWith("prueba")) {
    console.log("🧪 Modo prueba activado. Simulando pago aprobado.");
    return "APPROVED";
  }

  if (!BOLD_API_KEY) {
    console.error("❌ BOLD_API_KEY no configurada en variables de entorno.");
    return "UNKNOWN";
  }

  try {
    const res = await axios.get(`${BOLD_API_URL}/${orderId}`, {
      headers: {
        "x-api-key": BOLD_API_KEY,
      },
    });

    // El campo exacto depende de la respuesta de Bold (ajústalo si cambia)
    const status = res.data?.payment?.status?.toUpperCase() || "UNKNOWN";

    console.log(`✅ Estado de pago [${orderId}]:`, status);
    return status;
  } catch (error) {
    console.error("❌ Error al verificar pago con Bold:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    return "UNKNOWN";
  }
};
