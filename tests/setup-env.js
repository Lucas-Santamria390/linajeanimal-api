// tests/setup-env.js
// NOTA: MONGODB_URI se setea solo para que config/env.js no lance error.
// La conexión real va a MongoMemoryServer (ver db-helper.js).
process.env.MONGODB_URI = 'mongodb://dummy/linajeanimal_test';
process.env.JWT_SECRET = 'jwt_secret_para_pruebas_jest';
process.env.NODE_ENV = 'test';