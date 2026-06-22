// tests/infraestructura.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const { conectarTestDB, desconectarTestDB } = require('./db-helper');

describe('Prueba de Infraestructura de Tests', () => {
  describe('Health Check (no requiere BD)', () => {
    it('Debería responder 200 OK con la estructura correcta', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success');
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data.status).toBe('OK');
      expect(res.body.data).toHaveProperty('timestamp');
      expect(typeof res.body.data.timestamp).toBe('string');
    });
  });

  describe('Conexión a BD en memoria', () => {
    beforeAll(async () => {
      await conectarTestDB();
    }, 120000);

    afterAll(async () => {
      await desconectarTestDB();
    });

    it('Debería conectar a MongoMemoryServer exitosamente', async () => {
      const state = mongoose.connection.readyState;
      expect(state).toBe(1);
    });
  });
});