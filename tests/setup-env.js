// tests/setup-env.js

// Variables requeridas por config/env.js
process.env.MONGODB_URI = 'mongodb://localhost:27017/linajeanimal_test';
process.env.JWT_SECRET = 'token_secreto_ultra_seguro_para_pruebas_jest';
process.env.NODE_ENV = 'test';

// Aquí podrán agregar más variables en los siguientes issues si el proyecto lo requiere
// Ejemplo: process.env.NUEVA_VARIABLE = 'valor';