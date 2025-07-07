const axios = require("axios");
const BOLD_API_URL = "https://payments.api.bold.co/v2/payment-voucher";
const BOLD_API_KEY = process.env.BOLD_API_KEY;

exports.verificarPago = async (orderId) => {
  const res = await axios.get(`${BOLD_API_URL}/${orderId}`, {
    headers: {
      "x-api-key": BOLD_API_KEY,
    },
  });
  return res.data?.payment?.status || "unknown";
};
