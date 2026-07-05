const mongoose = require('mongoose');

// Define el esquema de especie (ej: Vaca, Gato, Caballo)
const especieSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la especie es obligatorio'],
    unique: true, // No pueden existir dos especies con el mismo nombre
    trim: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true, // Soft delete: false = eliminado lógico
  },
  // Contador desnormalizado para saber cuántos animales pertenecen a esta especie
  cantidadAnimales: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Especie', especieSchema);
