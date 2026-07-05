const mongoose = require('mongoose');

// Define el esquema del animal con subdocumentos embebidos para especie, raza y propietario
const animalSchema = new mongoose.Schema({
  nombre: {
    type: String,
    trim: true,
  },
  // Subdocumento embebido con referencia a la colección Especie
  especie: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Especie', required: true },
    nombre: { type: String, required: true },
  },
  // Subdocumento embebido con referencia a la colección Raza
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
    required: [true, 'El identificador es obligatorio'],
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
  // Referencia al padre del animal (autoreferencia a la misma colección Animal)
  padre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    default: null,
  },
  // Referencia a la madre del animal (autoreferencia a la misma colección Animal)
  madre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    default: null,
  },
  // Subdocumento embebido del propietario con datos del usuario
  propietario: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true },
    email: { type: String, required: true },
  },
  // Contador desnormalizado para evitar consultas costosas de conteo
  cantidadHijos: {
    type: Number,
    default: 0,
  },
  active: {
    type: Boolean,
    default: true, // Soft delete: false = eliminado lógico
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índices para optimizar las consultas más comunes
animalSchema.index({ nombre: 1 });
animalSchema.index({ 'especie._id': 1, 'raza._id': 1, active: 1 }); // Filtros combinados de especie + raza
animalSchema.index({ sexo: 1 });
animalSchema.index({ padre: 1 }); // Consultas de árbol genealógico por padre
animalSchema.index({ madre: 1 }); // Consultas de árbol genealógico por madre
animalSchema.index({ 'propietario._id': 1, active: 1 }); // Animales activos de un propietario
// Índice único compuesto: un identificador no puede repetirse para el mismo propietario
animalSchema.index({ identificador: 1, 'propietario._id': 1 }, { unique: true });
animalSchema.index({ active: 1 }); // Filtro de soft delete

module.exports = mongoose.model('Animal', animalSchema);
