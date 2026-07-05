const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define el esquema del usuario con validaciones y configuraciones
const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true, // Elimina espacios al inicio y final
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true, // No pueden existir dos usuarios con el mismo email
    lowercase: true, // Convierte automáticamente a minúsculas
    match: [/^\S+@\S+\.\S+$/, 'Email no válido'], // Valida formato de email
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false, // No se devuelve en consultas por defecto por seguridad
  },
  rol: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'Rol no válido: {VALUE}',
    },
    default: 'user', // Por defecto los nuevos usuarios son 'user'
  },
  active: {
    type: Boolean,
    default: true, // Soft delete: true = activo, false = eliminado lógico
  },
  tokenVersion: {
    type: Number,
    default: 0, // Permite invalidar tokens JWT antiguos al incrementarlo
  },
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
});

// Índice para optimizar consultas por rol
usuarioSchema.index({ rol: 1 });

// Hook 'pre-save': se ejecuta ANTES de guardar un usuario en la BD
usuarioSchema.pre('save', async function (next) {
  // Solo hashea la contraseña si fue modificada (evita re-hashear al actualizar otros campos)
  if (!this.isModified('password')) return next();
  // Hashea la contraseña con bcrypt usando 10 rondas de sal (costo computacional)
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.compararPassword = async function (candidate) {
  // bcrypt.compare compara el texto plano contra el hash almacenado
  return bcrypt.compare(candidate, this.password);
};

// Sobrescribe toJSON para eliminar la contraseña de las respuestas HTTP
usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password; // Nunca enviar la contraseña al cliente
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
