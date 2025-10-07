const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
  usuario: {
    type: String, // No usamos ref, ya que viene de otro microservicio
    required: true
  },
  usuarioNombre: {
    type: String,
    default: 'Usuario desconocido'
  },
  usuarioImagen: {
    type: String,
    default: ''
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
    minlength: [5, 'El comentario debe tener al menos 5 caracteres']
  },
  calificacion: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
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

// 🔹 Evita duplicados (un usuario solo una reseña por producto)
resenaSchema.index({ usuario: 1, producto: 1 }, { unique: true });

module.exports = mongoose.model('Resena', resenaSchema);
