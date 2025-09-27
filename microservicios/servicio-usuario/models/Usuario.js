// models/Usuario.js
const mongoose = require('mongoose');

// Subesquema de dirección
const DireccionSchema = new mongoose.Schema({
  departamento: { type: String, default: "" },
  municipio: { type: String, default: "" },
  calle: { type: String, default: "" },
  codigoPostal: { type: String, default: "" },
}, { _id: false });

// Esquema principal de usuario
const UsuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, "El nombre es obligatorio"],
    trim: true
  },
  direccion: {
    type: DireccionSchema,
    default: () => ({}) // siempre se inicializa como objeto
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
}, { 
  timestamps: true 
});

// Middleware para asegurar que direccion nunca sea primitivo
UsuarioSchema.pre('save', function(next) {
  if (!this.direccion || typeof this.direccion !== 'object') {
    this.direccion = {};
  }
  next();
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
