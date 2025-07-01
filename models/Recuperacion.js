const mongoose = require('mongoose');

const RecuperacionSchema = new mongoose.Schema({
  resetToken: {
    type: String
  },
  resetTokenExpira: {
    type: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Recuperacion', RecuperacionSchema);
