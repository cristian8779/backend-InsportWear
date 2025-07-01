const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

// Prevenir que el mismo producto se guarde más de una vez por usuario
historialSchema.index({ usuario: 1, producto: 1 }, { unique: true });

module.exports = mongoose.model('Historial', historialSchema);
