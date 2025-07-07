const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const carritoSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  productos: {
    type: [itemSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Carrito', carritoSchema);
