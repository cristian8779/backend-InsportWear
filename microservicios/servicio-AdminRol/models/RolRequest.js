const mongoose = require("mongoose");

const RolRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true }, // destinatario
    nuevoRol: {
      type: String,
      enum: ["admin", "superAdmin"],
      required: true,
    },
    codigo: {
      type: String,
      required: true,
    },
    expiracion: { type: Date, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "confirmado", "expirado", "cancelado"],
      default: "pendiente",
    },
    solicitante: { // ⬅️ Nuevo campo
      type: String,
      required: false, // lo podemos dejar opcional para compatibilidad
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RolRequest", RolRequestSchema);
