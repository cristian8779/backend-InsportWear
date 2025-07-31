const mongoose = require('mongoose');

// 📦 Subdocumento para variaciones del producto
const VariacionSchema = new mongoose.Schema({
    tallaNumero: {
        type: String,
        trim: true,
    },
    tallaLetra: {
        type: String,
        trim: true,
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
    // ✨ CAMBIO AQUÍ: Ahora 'imagenes' es un array de objetos
    imagenes: [
        {
            url: { type: String, trim: true },
            public_id: { type: String, trim: true }
        }
    ],
    precio: {
        type: Number,
        // ✨ Opcional: Si cada variación debe tener su propio precio
        // required: [true, 'El precio de la variación es obligatorio'],
        min: [0, 'El precio de variación no puede ser negativo']
    }
}, { _id: true }); // ✨ CAMBIO AQUÍ: Usamos '_id: true' para que cada variación tenga su propio ID único

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
        type: [VariacionSchema], // Esto está perfecto, es un array de subdocumentos
        default: []
    },
    stock: {
        type: Number,
        min: [0, 'El stock no puede ser negativo'],
        default: 0 // Cuando hay variaciones, este stock es 0 y el control se lleva en las variaciones
    },
    disponible: {
        type: Boolean,
        default: true
    },
    imagen: { // Esta es la imagen principal del producto
        type: String,
        trim: true
    },
    public_id: { // El public_id de la imagen principal del producto
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