const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true,
    trim: true
  },
  imagen: {
    type: String, // URL de la imagen en Cloudinary
    required: false // No es obligatorio al crear
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Categoria', CategoriaSchema);
