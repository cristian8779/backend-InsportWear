const mongoose = require('mongoose');

const FavoritoSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Favorito', FavoritoSchema);
