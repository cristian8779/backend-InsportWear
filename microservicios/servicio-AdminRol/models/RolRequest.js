const mongoose = require("mongoose");

const RolRequestSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    nuevoRol: {
      type: String,
      enum: ["admin", "superAdmin"], // Asegúrate que coincide con los que manejas en lógica
      required: true,
    },
    codigo: {
      type: String, // Código de 6 dígitos enviado por correo
      required: true,
    },
    expiracion: { type: Date, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "confirmado", "expirado", "cancelado"],
      default: "pendiente",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RolRequest", RolRequestSchema);
