// tests/infraestructura.test.js
const request = require('supertest');
const app = require('../app'); 
const { conectarTestDB, desconectarTestDB } = require('./db-helper');

beforeAll(async () => {
  await conectarTestDB();
});

afterAll(async () => {
  await desconectarTestDB();
});

describe('Prueba de Infraestructura de Tests', () => {
  it('Debería responder 200 OK en el endpoint de Health Check con la estructura correcta', async () => {
    const res = await request(app).get('/api/v1/health');
    
    // Verificamos el código de estado HTTP
    expect(res.statusCode).toEqual(200);
    
    // Validamos la estructura exacta que implementó el equipo
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(true);
    
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data.status).toBe('OK');
  });
});