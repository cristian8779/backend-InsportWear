const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true
  },
  direccion: {
    type: String,
    default: ""
  },
  telefono: {
    type: String,
    default: ""
  },
  imagenPerfil: {
    type: String,
    default: ""
  },
  cloudinaryId: {
    type: String,
    default: ""
  },
  credenciales: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Credenciales',
    required: true
  },
  recuperacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recuperacion'
  }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
