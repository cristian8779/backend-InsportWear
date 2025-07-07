const mongoose = require("mongoose");


const anuncioSchema = new mongoose.Schema({
  imagen: { type: String, required: true },
  deeplink: { type: String, required: true },
  fechaInicio: { type: Date, required: true },
  fechaFin: { type: Date, required: true },
  productoId: { type: String },
  categoriaId: { type: String },
  usuarioId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Anuncio", anuncioSchema);
