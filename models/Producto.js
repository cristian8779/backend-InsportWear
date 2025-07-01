const mongoose = require('mongoose');

// Subdocumento de variaciones
const VariacionSchema = new mongoose.Schema({
  talla: { type: String, required: true },
  color: { type: String, required: true },
  stock: { type: Number, required: true, min: 0 },
  imagen: { type: String }, // URL de imagen específica de la variación (opcional)
  public_id: { type: String }, // Para gestionar imágenes en Cloudinary (opcional)
  precio: { type: Number, min: 0 } // Precio específico para esta variación (opcional)
}, { _id: false });

// Esquema principal de producto
const ProductoSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  precio: { type: Number, required: true, min: 0 }, // Precio base del producto
  categoria: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categoria',
    required: true
  },
  variaciones: {
    type: [VariacionSchema],
    default: [] // Permite productos sin variaciones
  },
  stock: {
    type: Number,
    min: 0,
    default: 0 // Solo se usa si no hay variaciones
  },
  disponible: {
    type: Boolean,
    default: true // Solo se usa si no hay variaciones
  },
  imagen: { type: String }, // Imagen principal del producto
  public_id: { type: String }, // Imagen principal en Cloudinary (opcional)
  estado: {
    type: String,
    enum: ['activo', 'descontinuado'],
    default: 'activo'
  }
}, { timestamps: true });

module.exports = mongoose.model('Producto', ProductoSchema);
