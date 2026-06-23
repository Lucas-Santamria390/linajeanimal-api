// tests/especies.test.js
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

describe('Tests de Especies CRUD (API v1 Especies)', () => {
  const usuarioAdminPrueba = {
    nombre: 'Saul Admin',
    email: 'admin.especies@linaje.com',
    password: 'password123'
  };

  let token = '';

  beforeAll(async () => {
    await limpiarTestDB();
    
    // 1. Registramos al usuario a través de la API pública
    await request(app).post('/api/v1/auth/register').send(usuarioAdminPrueba);
    
    // 2. Jugada maestra: Modificamos directo en la colección nativa en español y campo correcto
    await mongoose.connection.db
      .collection('usuarios')
      .updateOne({ email: usuarioAdminPrueba.email }, { $set: { rol: 'admin' } });
    
    // 3. Iniciamos sesión para obtener el token con rol de admin real
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuarioAdminPrueba.email, password: usuarioAdminPrueba.password });
    
    token = loginRes.body.data.token;
  });

  const especiePrueba = { nombre: 'Canina', descripcion: 'Especie destinada a perros' };

  // --- 1. ACCESO SIN AUTENTICACIÓN (401) ---
  describe('Validación de Seguridad', () => {
    it('Debería denegar la creación de una especie si no se proporciona token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/especies')
        .send(especiePrueba);

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // --- 2. CREACIÓN EXITOSA E INVALIDA (201 / 400) ---
  describe('POST /api/v1/especies', () => {
    it('Debería crear una especie exitosamente con token válido de admin (201)', async () => {
      const res = await request(app)
        .post('/api/v1/especies')
        .set('Authorization', `Bearer ${token}`)
        .send(especiePrueba);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
    });

    it('Debería denegar la creación si los datos son inválidos o faltan campos (400)', async () => {
      const res = await request(app)
        .post('/api/v1/especies')
        .set('Authorization', `Bearer ${token}`)
        .send({ descripcion: 'Falta el campo nombre obligatorio' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // --- 3. LISTADO Y OBTENCIÓN POR ID (200) ---
  describe('GET /api/v1/especies', () => {
    it('Debería listar todas las especies (200)', async () => {
      const res = await request(app).get('/api/v1/especies');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('Debería obtener una especie específica por su ID (200)', async () => {
      const nuevaEspecie = await request(app)
        .post('/api/v1/especies')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Felina', descripcion: 'Gatos' });
      
      const especieId = nuevaEspecie.body.data._id;

      const res = await request(app).get(`/api/v1/especies/${especieId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data._id).toEqual(especieId);
    });
  });

  // --- 4. ACTUALIZACIÓN (200) ---
  describe('PUT /api/v1/especies/:id', () => {
    it('Debería actualizar los datos de una especie (200)', async () => {
      const nuevaEspecie = await request(app)
        .post('/api/v1/especies')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Equina', descripcion: 'Caballos' });
      
      const especieId = nuevaEspecie.body.data._id;

      const res = await request(app)
        .put(`/api/v1/especies/${especieId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Equino Modificado' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.nombre).toEqual('Equino Modificado');
    });
  });

  // --- 5. ELIMINACIÓN Y SOFT DELETE (200) ---
  describe('DELETE /api/v1/especies/:id', () => {
    it('Debería aplicar borrado lógico (soft delete) a la especie (200)', async () => {
      const nuevaEspecie = await request(app)
        .post('/api/v1/especies')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Porcina', descripcion: 'Cerdos' });
      
      const especieId = nuevaEspecie.body.data._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/especies/${especieId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.statusCode).toEqual(200);
      expect(deleteRes.body).toHaveProperty('success', true);

      const verificarRes = await request(app).get(`/api/v1/especies/${especieId}`);
      
      if (verificarRes.statusCode === 200) {
        expect(verificarRes.body.data).toHaveProperty('deleted', true);
      } else {
        expect(verificarRes.statusCode).toEqual(404);
      }
    });
  });
});