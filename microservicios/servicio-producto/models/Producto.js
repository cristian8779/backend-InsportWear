const mongoose = require('mongoose');

/**
 * @file Modelo de Mongoose para el Producto.
 * @description Define el esquema para los productos y sus variaciones.
 */

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
        nombre: {
            type: String,
            required: false, // CORREGIDO: Ahora es opcional para evitar errores de validación con datos antiguos.
            trim: true,
        },
        hex: {
            type: String,
            required: false, // CORREGIDO: Ahora es opcional.
            trim: true,
            match: [/^#([0-9A-Fa-f]{6})$/, 'El formato del color debe ser hexadecimal (ej. #FF0000)']
        }
    },
    stock: {
        type: Number,
        required: [true, 'El stock de la variación es obligatorio'],
        min: [0, 'El stock no puede ser negativo']
    },
    imagenes: [
        {
            url: { type: String, trim: true },
            public_id: { type: String, trim: true }
        }
    ],
    precio: {
        type: Number,
        // Se añade required para asegurar que el precio siempre se defina.
        required: [true, 'El precio de variación es obligatorio'],
        min: [0, 'El precio de variación no puede ser negativo']
    }
}, { _id: true }); // Cada variación tiene su propio ID único

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
