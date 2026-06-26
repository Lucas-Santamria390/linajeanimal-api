// tests/razas.test.js
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const { conectarTestDB, desconectarTestDB, limpiarTestDB } = require('./db-helper');

beforeAll(async () => {
  await conectarTestDB();
});

afterAll(async () => {
  await desconectarTestDB();
});

describe('Tests de Razas CRUD (API v1 Razas)', () => {
  const usuarioAdminPrueba = {
    nombre: 'Saul Admin Razas',
    email: 'admin.razas@linaje.com',
    password: 'Password123!'
  };

  let token = '';
  let especieIdPadre = ''; // Para vincular las razas a una especie real

  beforeAll(async () => {
    await limpiarTestDB();
    
    // 1. Registramos al usuario administrador
    await request(app).post('/api/v1/auth/register').send(usuarioAdminPrueba);
    
    // 2. Jugada maestra: Forzamos el rol de admin directo en la BD nativa
    await mongoose.connection.db
      .collection('usuarios')
      .updateOne({ email: usuarioAdminPrueba.email }, { $set: { rol: 'admin' } });
    
    // 3. Logueamos para obtener el Token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuarioAdminPrueba.email, password: usuarioAdminPrueba.password });
    
    token = loginRes.body.data.token;

    // 4. Creamos una especie base para vincularla a las razas en los tests
    const especieRes = await request(app)
      .post('/api/v1/especies')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Canina de Prueba', descripcion: 'Especie para testear razas' });
    
    especieIdPadre = especieRes.body.data._id;
  });

  // --- 1. ACCESO SIN AUTENTICACIÓN (401) ---
  describe('Validación de Seguridad', () => {
    it('Debería denegar la creación de una raza si no se proporciona token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/razas')
        .send({ nombre: 'Pastor Alemán', especie: especieIdPadre });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // --- 2. CREACIÓN (201 / 400 / VINCULACIÓN) ---
  describe('POST /api/v1/razas', () => {
    it('Debería crear una raza exitosamente vinculada a una especie (201)', async () => {
      const res = await request(app)
        .post('/api/v1/razas')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nombre: 'American Bully',
          descripcion: 'Raza fuerte y compacta',
          especie: especieIdPadre // <-- Aquí se cumple el test de raza vinculada a especie
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.especie.toString()).toEqual(especieIdPadre.toString());
    });

    it('Debería denegar la creación si los datos son inválidos o faltan campos (400)', async () => {
      const res = await request(app)
        .post('/api/v1/razas')
        .set('Authorization', `Bearer ${token}`)
        .send({ descripcion: 'Falta el campo nombre obligatorio' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // --- 3. LISTADO Y OBTENCIÓN POR ID (200) ---
  describe('GET /api/v1/razas', () => {
    it('Debería listar todas las razas (200)', async () => {
      const res = await request(app).get('/api/v1/razas');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Debería obtener una raza específica por su ID (200)', async () => {
      const nuevaRaza = await request(app)
        .post('/api/v1/razas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Rottweiler', especie: especieIdPadre });
      
      const razaId = nuevaRaza.body.data._id;

      const res = await request(app).get(`/api/v1/razas/${razaId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data._id).toEqual(razaId);
    });
  });

  // --- 4. ACTUALIZACIÓN (200) ---
  describe('PUT /api/v1/razas/:id', () => {
    it('Debería actualizar los datos de una raza (200)', async () => {
      const nuevaRaza = await request(app)
        .post('/api/v1/razas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Husky', especie: especieIdPadre });
      
      const razaId = nuevaRaza.body.data._id;

      const res = await request(app)
        .put(`/api/v1/razas/${razaId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Husky Siberiano Modificado' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.nombre).toEqual('Husky Siberiano Modificado');
    });
  });

  // --- 5. ELIMINACIÓN Y SOFT DELETE (200) ---
  describe('DELETE /api/v1/razas/:id', () => {
    it('Debería aplicar borrado lógico (soft delete) a la raza (200)', async () => {
      const nuevaRaza = await request(app)
        .post('/api/v1/razas')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Chihuahua', especie: especieIdPadre });
      
      const razaId = nuevaRaza.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/razas/${razaId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body).toHaveProperty('success', true);

      // Verificamos si devuelve 404 o si el objeto viene marcado como deleted
      const verificarRes = await request(app).get(`/api/v1/razas/${razaId}`);
      
      if (verificarRes.statusCode === 200) {
        expect(verificarRes.body.data).toHaveProperty('deleted', true);
      } else {
        expect(verificarRes.statusCode).toEqual(404);
      }
    });
  });
});