const mongoose = require('mongoose');

const RecuperacionSchema = new mongoose.Schema({
  // Código de 6 dígitos para verificación
  codigoVerificacion: {
    type: Number,
    min: 100000,
    max: 999999
  },
  codigoExpira: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Recuperacion', RecuperacionSchema);
