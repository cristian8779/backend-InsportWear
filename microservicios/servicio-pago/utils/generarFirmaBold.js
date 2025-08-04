const crypto = require("crypto");

module.exports = ({ orderId, amount, currency, secretKey }) => {
  const data = `${orderId}${amount}${currency}${secretKey}`;
  return crypto.createHash("sha256").update(data).digest("hex");
};
