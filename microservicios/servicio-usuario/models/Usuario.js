// models/Usuario.js
const mongoose = require('mongoose');

const DireccionSchema = new mongoose.Schema({
  departamento: { type: String, default: "" },
  municipio: { type: String, default: "" },
  calle: { type: String, default: "" },
  codigoPostal: { type: String, default: "" },
 
}, { _id: false }); // No necesitamos un _id para la subdirección

const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true
  },
  direccion: {
    type: DireccionSchema,
    default: () => ({})
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
    ref: 'Recuperacion',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
