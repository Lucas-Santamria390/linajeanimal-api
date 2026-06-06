const mongoose = require('mongoose');

const razaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la raza es obligatorio'],
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  especie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Especie',
    required: [true, 'La especie es obligatoria'],
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

razaSchema.index({ nombre: 1, especie: 1 }, { unique: true });
razaSchema.index({ especie: 1 });

module.exports = mongoose.model('Raza', razaSchema);
