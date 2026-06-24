// tests/auth.test.js
const request = require('supertest');
const app = require('../app');
const { conectarTestDB, desconectarTestDB, limpiarTestDB } = require('./db-helper');

beforeAll(async () => {
  await conectarTestDB();
});

afterAll(async () => {
  await desconectarTestDB();
});

// Limpiamos la base de datos entre cada test para evitar correos duplicados residuales
beforeEach(async () => {
  await limpiarTestDB();
});

describe('Tests de Autenticación (API v1 Auth)', () => {
  const usuarioPrueba = {
    nombre: 'Saul Test',
    email: 'saul@test.com',
    password: 'password123'
  };

  // --- 1. TEST DE REGISTRO ---
  describe('POST /api/v1/auth/register', () => {
    it('Debería registrar un usuario exitosamente (201)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(usuarioPrueba);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
    });

    it('Debería denegar el registro con un email duplicado (409)', async () => {
      // Registrar el primero
      await request(app).post('/api/v1/auth/register').send(usuarioPrueba);
      
      // Intentar registrar el segundo con el mismo email
      const res = await request(app).post('/api/v1/auth/register').send(usuarioPrueba);
      expect(res.statusCode).toEqual(409); 
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // --- 2. TEST DE LOGIN ---
  describe('POST /api/v1/auth/login', () => {
    it('Debería iniciar sesión exitosamente y retornar un token JWT (200)', async () => {
      // Primero registramos al usuario
      await request(app).post('/api/v1/auth/register').send(usuarioPrueba);

      // Intentamos el login
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: usuarioPrueba.email, password: usuarioPrueba.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      // Validamos que la respuesta contenga el token (asumiendo la estructura común de data.token)
      expect(res.body.data).toHaveProperty('token');
    });

    it('Debería denegar el acceso con credenciales inválidas (401)', async () => {
      await request(app).post('/api/v1/auth/register').send(usuarioPrueba);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: usuarioPrueba.email, password: 'password_incorrecto' });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // --- 3. TEST DE PERFIL ---
  describe('GET /api/v1/auth/profile', () => {
    it('Debería obtener el perfil del usuario con un token válido (200)', async () => {
      await request(app).post('/api/v1/auth/register').send(usuarioPrueba);

      // Login para obtener token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: usuarioPrueba.email, password: usuarioPrueba.password });
      
      const token = loginRes.body.data.token;

      // Petición al perfil enviando el token en los Headers
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
    });

    it('Debería rechazar el acceso al perfil sin token (401)', async () => {
      const res = await request(app).get('/api/v1/auth/profile');

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});