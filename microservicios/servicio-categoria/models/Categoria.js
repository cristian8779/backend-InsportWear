const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  imagen: {
    type: String,
    required: false
  },
  public_id: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
