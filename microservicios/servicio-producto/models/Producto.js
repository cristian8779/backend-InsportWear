const mongoose = require('mongoose');

// 📦 Subdocumento para variaciones del producto
const VariacionSchema = new mongoose.Schema({
  talla: {
    type: String,
    required: [true, 'La talla es obligatoria'],
    trim: true
  },
  color: {
    type: String,
    required: [true, 'El color es obligatorio'],
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'El stock de la variación es obligatorio'],
    min: [0, 'El stock no puede ser negativo']
  },
  imagen: {
    type: String,
    trim: true
  },
  public_id: {
    type: String,
    trim: true
  },
  precio: {
    type: Number,
    min: [0, 'El precio de variación no puede ser negativo']
  }
}, { _id: false });

// 🛍️ Esquema principal del producto
const ProductoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción del producto es obligatoria'],
    trim: true,
    minlength: [5, 'La descripción debe tener al menos 5 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio base es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: [true, 'La categoría es obligatoria']
  },
  subcategoria: {
    type: String,
    trim: true
  },
  variaciones: {
    type: [VariacionSchema],
    default: []
  },
  stock: {
    type: Number,
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  disponible: {
    type: Boolean,
    default: true
  },
  imagen: {
    type: String,
    trim: true
  },
  public_id: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['activo', 'descontinuado'],
    default: 'activo'
  }
}, { timestamps: true });

module.exports = mongoose.model('Producto', ProductoSchema);
