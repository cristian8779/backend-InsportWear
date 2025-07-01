const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  talla: { type: String, required: true },
  color: { type: String, required: true },
  cantidad: { type: Number, required: true }
});

const carritoSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
  productos: [itemSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Carrito', carritoSchema);
