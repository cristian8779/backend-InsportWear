const mongoose = require('mongoose');

const FavoritoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Asume que tu modelo de usuario se llama 'Usuario'
    required: true
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  variacion: {
    talla: { type: String, required: true },
    color: { type: String, required: true }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Favorito', FavoritoSchema);
