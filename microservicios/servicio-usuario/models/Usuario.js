// models/Usuario.js
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
    ref: 'Credenciales', // Aunque el modelo no está aquí, se referencia por nombre
    required: true
  },
  recuperacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recuperacion', // Igual, se usa solo como referencia
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
