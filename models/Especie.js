const mongoose = require('mongoose');

const especieSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la especie es obligatorio'],
    unique: true,
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});


module.exports = mongoose.model('Especie', especieSchema);
