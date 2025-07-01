const mongoose = require("mongoose");

const RolRequestSchema = new mongoose.Schema({
  email: { type: String, required: true },
  nuevoRol: { type: String, enum: ["admin", "superadmin"], required: true },
  token: { type: String, required: true },
  expiracion: { type: Date, required: true },
  estado: {
    type: String,
    enum: ["pendiente", "confirmado", "expirado", "cancelado"],
    default: "pendiente"
  }
}, { timestamps: true });

module.exports = mongoose.model("RolRequest", RolRequestSchema);
