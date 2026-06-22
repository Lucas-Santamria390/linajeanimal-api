// jest.config.js
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  setupFiles: [
    '<rootDir>/tests/setup-env.js'
  ]
};