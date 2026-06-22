// jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Carga de forma global las variables antes de ejecutar las suites de prueba
  setupFiles: [
    '<rootDir>/tests/setup-env.js'
  ]
};