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
  process.env.MONGODB_URI = uri;
};

/**
 * Desconecta y detiene el servidor en memoria.
 */
const desconectarTestDB = async () => {
  try {
    await mongoose.disconnect();
  } finally {
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
};

/**
 * Limpia todos los datos de las colecciones entre pruebas si es necesario.
 */
const limpiarTestDB = async () => {
  const collections = mongoose.connection.collections;
  const promises = Object.keys(collections).map(key => collections[key].deleteMany({}));
  await Promise.all(promises);
};

module.exports = {
  conectarTestDB,
  desconectarTestDB,
  limpiarTestDB
};