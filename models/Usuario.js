const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email no válido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    select: false,
  },
  rol: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'Rol no válido: {VALUE}',
    },
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

usuarioSchema.index({ rol: 1 });

usuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usuarioSchema.methods.compararPassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

usuarioSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Usuario', usuarioSchema);
