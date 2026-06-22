// tests/db-helper.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Conecta a la base de datos en memoria simulada.
 */
const conectarTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Evitamos conflictos si ya existía una conexión activa
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(uri);
};

/**
 * Desconecta y detiene el servidor en memoria.
 */
const desconectarTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Limpia todos los datos de las colecciones entre pruebas si es necesario.
 */
const limpiarTestDB = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  conectarTestDB,
  desconectarTestDB,
  limpiarTestDB
};