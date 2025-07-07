const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
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
  comentario: {
    type: String,
    required: [true, 'El comentario es obligatorio'],
    trim: true,
    minlength: 5
  },
  calificacion: {
    type: Number,
    required: true,
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Un usuario no puede dejar múltiples reseñas para el mismo producto
resenaSchema.index({ usuario: 1, producto: 1 }, { unique: true });

module.exports = mongoose.model('Resena', resenaSchema);
