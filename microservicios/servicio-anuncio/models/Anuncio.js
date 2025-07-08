const mongoose = require("mongoose");
const { Schema } = mongoose;

const anuncioSchema = new Schema({
  imagen: {
    type: String,
    required: [true, 'Debes subir una imagen para el anuncio.']
  },
  publicId: {
    type: String,
    required: [true, 'No se pudo guardar la imagen correctamente. Por favor, intenta subirla de nuevo.']
  },
  deeplink: {
    type: String,
    required: [true, 'Es necesario especificar hacia dónde debe dirigir el anuncio.']
  },
  fechaInicio: {
    type: Date,
    required: [true, 'La fecha de inicio del anuncio es obligatoria.']
  },
  fechaFin: {
    type: Date,
    required: [true, 'La fecha de finalización del anuncio es obligatoria.'],
    validate: {
      validator: function (value) {
        return value >= this.fechaInicio;
      },
      message: 'La fecha de finalización no puede ser anterior a la fecha de inicio.'
    }
  },
  productoId: {
    type: String,
    default: null
  },
  categoriaId: {
    type: String,
    default: null
  },
  usuarioId: {
    type: String,
    required: [true, '']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Anuncio", anuncioSchema);
