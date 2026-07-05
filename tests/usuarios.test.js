const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Usuario = require('../models/Usuario');
const { conectarTestDB, desconectarTestDB, limpiarTestDB } = require('./db-helper');

beforeAll(async () => {
  await conectarTestDB();
}, 120000);

afterAll(async () => {
  await desconectarTestDB();
});

describe('Tests de Usuarios CRUD + Activacion (API v1 Usuarios)', () => {
  const adminData = {
    nombre: 'Saul Admin Usuarios',
    email: 'admin.usuarios@linaje.com',
    password: 'Password123!',
  };

  let adminToken = '';
  let usuarios = {};

  const crearUsuario = async (payload) => {
    const res = await request(app)
      .post('/api/v1/usuarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    return res.body.data;
  };

  beforeAll(async () => {
    await limpiarTestDB();

    await request(app).post('/api/v1/auth/register').send(adminData);

    await mongoose.connection.db
      .collection('usuarios')
      .updateOne({ email: adminData.email }, { $set: { rol: 'admin' } });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminData.email, password: adminData.password });

    adminToken = loginRes.body.data.token;

    usuarios = {
      uno: await crearUsuario({
        nombre: 'Usuario Uno',
        email: 'usuario.uno@linaje.com',
        password: 'Password123!',
      }),
      dos: await crearUsuario({
        nombre: 'Usuario Dos',
        email: 'usuario.dos@linaje.com',
        password: 'Password123!',
      }),
      tres: await crearUsuario({
        nombre: 'Usuario Tres',
        email: 'usuario.tres@linaje.com',
        password: 'Password123!',
      }),
      cuatro: await crearUsuario({
        nombre: 'Usuario Cuatro',
        email: 'usuario.cuatro@linaje.com',
        password: 'Password123!',
      }),
    };
  }, 120000);

  describe('GET /api/v1/usuarios', () => {
    it('Debería listar usuarios con paginación (200)', async () => {
      const res = await request(app)
        .get('/api/v1/usuarios?page=2&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      const totalUsuarios = await Usuario.countDocuments();
      const esperadoPages = Math.ceil(totalUsuarios / 2);

      expect(res.body.pagination).toEqual(
        expect.objectContaining({
          page: 2,
          limit: 2,
          total: totalUsuarios,
          pages: esperadoPages,
        })
      );
    });
  });

  describe('GET /api/v1/usuarios/:id', () => {
    it('Debería obtener un usuario activo por su ID (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/usuarios/${usuarios.uno._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data._id.toString()).toEqual(usuarios.uno._id.toString());
      expect(res.body.data.active).toBe(true);
    });
  });

  describe('POST /api/v1/usuarios', () => {
    it('Debería crear un usuario exitosamente (201)', async () => {
      const res = await request(app)
        .post('/api/v1/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Usuario Nuevo',
          email: 'usuario.nuevo@linaje.com',
          password: 'Password123!',
          rol: 'user',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.email).toBe('usuario.nuevo@linaje.com');
      expect(res.body.data.active).toBe(true);
    });
  });

  describe('PUT /api/v1/usuarios/:id', () => {
    it('Debería actualizar un usuario (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/usuarios/${usuarios.uno._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Usuario Uno Editado',
          rol: 'admin',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.nombre).toBe('Usuario Uno Editado');
      expect(res.body.data.rol).toBe('admin');
    });
  });

  describe('DELETE /api/v1/usuarios/:id', () => {
    it('Debería desactivar un usuario (200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/usuarios/${usuarios.dos._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.active).toBe(false);

      const getRes = await request(app)
        .get(`/api/v1/usuarios/${usuarios.dos._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (getRes.statusCode === 200) {
        expect(getRes.body.data).toHaveProperty('active', false);
      } else {
        expect(getRes.statusCode).toEqual(404);
      }
    });
  });

  describe('PATCH /api/v1/usuarios/:id', () => {
    it('Debería reactivar un usuario desactivado (200)', async () => {
      const deactivateRes = await request(app)
        .delete(`/api/v1/usuarios/${usuarios.tres._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deactivateRes.statusCode).toEqual(200);
      expect(deactivateRes.body.data.active).toBe(false);

      const reactivateRes = await request(app)
        .patch(`/api/v1/usuarios/${usuarios.tres._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: true });

      expect(reactivateRes.statusCode).toEqual(200);
      expect(reactivateRes.body).toHaveProperty('success', true);
      expect(reactivateRes.body.data.active).toBe(true);

      const getRes = await request(app)
        .get(`/api/v1/usuarios/${usuarios.tres._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.statusCode).toEqual(200);
      expect(getRes.body.data.active).toBe(true);
    });
  });
});
