// models/SearchQuota.js
const mongoose = require('mongoose');

const SearchQuotaSchema = new mongoose.Schema({
  fecha: { type: String, required: true }, // formato '2025-07-11'
  usadas: { type: Number, default: 0 }
});

module.exports = mongoose.model('SearchQuota', SearchQuotaSchema);
