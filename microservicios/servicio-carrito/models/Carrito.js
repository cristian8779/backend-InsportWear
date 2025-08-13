const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  productoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  variacionId: {
    type: mongoose.Schema.Types.ObjectId, // opcional
    ref: 'Variacion'
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  precio: {
    type: Number,
    required: true
  },
  atributos: {
    color: {
      nombre: { type: String },
      hex: { type: String }
    },
    tallaLetra: { type: String },
    tallaNumero: { type: String },
    imagen: { type: String }
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
