// Configuración de conexión a MongoDB con Mongoose
const mongoose = require('mongoose');
const config = require('./env');

// Conecta a MongoDB y maneja errores de conexión inicial
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // Termina el proceso si no puede conectar
  }
};

// Eventos de la conexión para monitoreo en runtime
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
