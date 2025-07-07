const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Producto",
    required: true
  },
  nombreProducto: { // <-- Este campo es nuevo
    type: String,
    required: true,
    trim: true
  },
  talla: { type: String, required: true },
  color: { type: String, required: true },
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
