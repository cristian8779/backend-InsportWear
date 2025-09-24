// models/Venta.js
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
  imagen: { // 🔹 Campo agregado
    type: String,
    default: null
  },
  talla: { type: String, default: null },
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
  nombreUsuario: {
    type: String,
    required: true,
    trim: true
  },
  telefonoUsuario: {
    type: String,
    default: ""
  },
  direccionUsuario: {
    type: String,
    default: ""
  },
  productos: [productoSchema],
  total: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  referenciaPago: {
    type: String,
    required: true
  },
  estadoPago: {
    type: String,
    enum: ["approved", "pending", "failed"],
    default: "pending"
  }
});

module.exports = mongoose.model("Venta", ventaSchema);
