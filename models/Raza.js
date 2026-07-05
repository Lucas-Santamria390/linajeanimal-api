const mongoose = require('mongoose');

// Define el esquema de raza
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
  // Referencia a la especie a la que pertenece esta raza
  especie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Especie',
    required: [true, 'La especie es obligatoria'],
  },
  active: {
    type: Boolean,
    default: true, // Soft delete: false = eliminado lógico
  },
  // Contador desnormalizado para saber cuántos animales pertenecen a esta raza
  cantidadAnimales: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índice único compuesto: el nombre de raza debe ser único dentro de una misma especie
razaSchema.index({ nombre: 1, especie: 1 }, { unique: true });
// Índice para filtrar razas por especie
razaSchema.index({ especie: 1 });

module.exports = mongoose.model('Raza', razaSchema);
