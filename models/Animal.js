const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del animal es obligatorio'],
    trim: true,
  },
  especie: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Especie', required: true },
    nombre: { type: String, required: true },
  },
  raza: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Raza', required: true },
    nombre: { type: String, required: true },
  },
  sexo: {
    type: String,
    required: [true, 'El sexo es obligatorio'],
    enum: {
      values: ['macho', 'hembra'],
      message: 'Sexo no válido: {VALUE}',
    },
  },
  fechaNacimiento: {
    type: Date,
    required: [true, 'La fecha de nacimiento es obligatoria'],
  },
  peso: {
    type: Number,
  },
  color: {
    type: String,
    trim: true,
  },
  identificador: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  fotoUrl: {
    type: String,
    trim: true,
  },
  notas: {
    type: String,
    trim: true,
  },
  padre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    default: null,
  },
  madre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    default: null,
  },
  propietario: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true },
    email: { type: String, required: true },
  },
  cantidadHijos: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

animalSchema.index({ nombre: 1 });
animalSchema.index({ 'especie._id': 1, 'raza._id': 1, active: 1 });
animalSchema.index({ sexo: 1 });
animalSchema.index({ padre: 1 });
animalSchema.index({ madre: 1 });
animalSchema.index({ 'propietario._id': 1, active: 1 });
animalSchema.index({ active: 1 });

module.exports = mongoose.model('Animal', animalSchema);
