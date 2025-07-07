const crypto = require("crypto");

module.exports = ({ orderId, amount, currency, secretKey }) => {
  const data = `${orderId}${amount}${currency}`;
  return crypto.createHmac("sha256", secretKey).update(data).digest("hex");
};
