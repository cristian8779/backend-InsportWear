const mongoose = require('mongoose');

const CredencialesSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "El correo es obligatorio"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, "Por favor, ingrese un correo válido"]
  },
  password: {
    type: String,
    required: [true, "La contraseña es obligatoria"]
  },
  rol: {
    type: String,
    enum: ["usuario", "admin", "superAdmin"],
    default: 'usuario'
  },
  refreshToken: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Credenciales', CredencialesSchema);
