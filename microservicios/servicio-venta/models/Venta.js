const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Producto",
    required: true
  },
  nombreProducto: {
    type: String,
    required: true,
    trim: true
  },
  // 🔹 Talla y color opcionales para ventas desde pago (solo se usan si hay variación)
  talla: { type: String, required: false },
  color: {
    type: {
      hex: { type: String },
      nombre: { type: String }
    },
    required: false
  },
  cantidad: { type: Number, required: true },
  precioUnitario: { type: Number, required: true }
});

const ventaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  productos: [productoSchema],
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  referenciaPago: {
    type: String,
    required: false
  },
  estadoPago: {
    type: String,
    enum: ["approved", "pending", "failed"],
    default: "pending"
  }
});

module.exports = mongoose.model("Venta", ventaSchema);
