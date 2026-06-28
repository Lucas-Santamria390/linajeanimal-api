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

describe('Tests de Animales CRUD + Genealogía (API v1 Animales)', () => {
  const usuarioAdminPrueba = {
    nombre: 'Saul Admin Animales',
    email: 'admin.animales@linaje.com',
    password: 'Password123!'
  };

  const usuarioRegularPrueba = {
    nombre: 'Usuario Normal',
    email: 'normal@test.com',
    password: 'Password123!'
  };

  let tokenAdmin = '';
  let tokenRegular = '';
  let especieId;
  let razaId;
  let propietarioId;

  let idPadre;
  let idMadre;
  let idAnimalPrincipal;
  let idHermano;
  let idNuevoPadre;

  const crearEspecieYRaza = async (token) => {
    const especieRes = await request(app)
      .post('/api/v1/especies')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Bovina', descripcion: 'Ganado bovino' });
    especieId = especieRes.body.data._id;

    const razaRes = await request(app)
      .post('/api/v1/razas')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Angus', especie: especieId });
    razaId = razaRes.body.data._id;
  };

  const crearAnimalViaAPI = async (datos) => {
    const res = await request(app)
      .post('/api/v1/animales')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: datos.nombre,
        sexo: datos.sexo,
        especie: especieId,
        raza: razaId,
        fechaNacimiento: datos.fechaNacimiento || '2023-01-15',
        padre: datos.padre || null,
        madre: datos.madre || null,
        ...datos.extra
      });
    return res;
  };

  beforeAll(async () => {
    await limpiarTestDB();

    await request(app).post('/api/v1/auth/register').send(usuarioAdminPrueba);
    await request(app).post('/api/v1/auth/register').send(usuarioRegularPrueba);

    await mongoose.connection.db
      .collection('usuarios')
      .updateOne({ email: usuarioAdminPrueba.email }, { $set: { rol: 'admin' } });

    const loginAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuarioAdminPrueba.email, password: usuarioAdminPrueba.password });
    tokenAdmin = loginAdmin.body.data.token;
    propietarioId = loginAdmin.body.data.usuario?._id || loginAdmin.body.data._id;

    const loginRegular = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: usuarioRegularPrueba.email, password: usuarioRegularPrueba.password });
    tokenRegular = loginRegular.body.data.token;

    await crearEspecieYRaza(tokenAdmin);

    const padreRes = await crearAnimalViaAPI({ nombre: 'Toro Zeus', sexo: 'macho' });
    idPadre = padreRes.body.data._id;

    const madreRes = await crearAnimalViaAPI({ nombre: 'Vaca Hera', sexo: 'hembra' });
    idMadre = madreRes.body.data._id;

    const principalRes = await crearAnimalViaAPI({
      nombre: 'Becerro Hercules', sexo: 'macho',
      padre: idPadre, madre: idMadre
    });
    idAnimalPrincipal = principalRes.body.data._id;

    const hermanoRes = await crearAnimalViaAPI({
      nombre: 'Becerra Atenea', sexo: 'hembra',
      padre: idPadre, madre: idMadre
    });
    idHermano = hermanoRes.body.data._id;

    const nuevoPadreRes = await crearAnimalViaAPI({ nombre: 'Toro Poseidon', sexo: 'macho' });
    idNuevoPadre = nuevoPadreRes.body.data._id;
  });

  describe('Validación de Seguridad', () => {
    it('Debería denegar la creación de un animal sin token (401)', async () => {
      const res = await request(app)
        .post('/api/v1/animales')
        .send({ nombre: 'Test', sexo: 'macho', especie: especieId, raza: razaId, fechaNacimiento: '2023-01-15' });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('Debería denegar la eliminación de un animal sin token (401)', async () => {
      const res = await request(app).delete(`/api/v1/animales/${idAnimalPrincipal}`);
      expect(res.statusCode).toEqual(401);
    });

    it('Debería denegar la eliminación de un animal con usuario no admin (403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/animales/${idAnimalPrincipal}`)
        .set('Authorization', `Bearer ${tokenRegular}`);
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('POST /api/v1/animales', () => {
    it('Debería crear un animal exitosamente (201)', async () => {
      const res = await crearAnimalViaAPI({
        nombre: 'Nuevo Ternero', sexo: 'macho',
        extra: { identificador: 'TEST-001' }
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.nombre).toEqual('Nuevo Ternero');
    });

    it('Debería denegar la creación si faltan campos obligatorios (400)', async () => {
      const res = await request(app)
        .post('/api/v1/animales')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('Debería denegar la creación con sexo inválido (400)', async () => {
      const res = await request(app)
        .post('/api/v1/animales')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
          nombre: 'Invalido', sexo: 'X', especie: especieId, raza: razaId, fechaNacimiento: '2023-01-15'
        });
      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /api/v1/animales', () => {
    it('Debería listar todos los animales activos (200)', async () => {
      const res = await request(app)
        .get('/api/v1/animales')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('Debería filtrar animales por sexo (200)', async () => {
      const res = await request(app)
        .get('/api/v1/animales?sexo=macho')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(a => a.sexo === 'macho')).toBe(true);
    });

    it('Debería filtrar animales por nombre (200)', async () => {
      const res = await request(app)
        .get('/api/v1/animales?nombre=Toro')
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Debería obtener un animal específico por su ID (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/animales/${idAnimalPrincipal}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data._id.toString()).toEqual(idAnimalPrincipal.toString());
      expect(res.body.data.nombre).toEqual('Becerro Hercules');
    });
  });

  describe('PUT /api/v1/animales/:id', () => {
    it('Debería actualizar los datos de un animal (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/animales/${idAnimalPrincipal}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ nombre: 'Hercules Modificado', peso: 450 });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.nombre).toEqual('Hercules Modificado');
    });
  });

  describe('Funcionalidades de Genealogía', () => {
    it('Debería obtener los hermanos de un animal (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/animales/${idAnimalPrincipal}/siblings`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(a => a._id.toString() === idHermano.toString())).toBe(true);
    });

    it('Debería obtener los hijos de un animal (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/animales/${idPadre}/children`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('Debería obtener el árbol genealógico de un animal (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/animales/${idAnimalPrincipal}/family-tree`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('arbol');
      expect(res.body.data).toHaveProperty('generaciones');
    });

    it('Debería asignar un nuevo padre a un animal (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/animales/${idAnimalPrincipal}/parents`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ padre: idNuevoPadre.toString() });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.padre._id.toString()).toEqual(idNuevoPadre.toString());
    });

    it('Debería denegar asignar un padre macho como madre (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/animales/${idAnimalPrincipal}/parents`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ madre: idNuevoPadre.toString() });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('Debería denegar asignar un padre inexistente (400)', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/animales/${idAnimalPrincipal}/parents`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ padre: fakeId.toString() });
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('Debería denegar asignar un descendiente como madre (400)', async () => {
      const res = await request(app)
        .post(`/api/v1/animales/${idPadre}/parents`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ madre: idHermano.toString() });
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('Debería obtener el árbol genealógico con profundidad personalizada (200)', async () => {
      const res = await request(app)
        .get(`/api/v1/animales/${idAnimalPrincipal}/family-tree?generaciones=1`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('generaciones', 1);
      expect(res.body.data).toHaveProperty('arbol');
    });
  });

  describe('DELETE /api/v1/animales/:id', () => {
    it('Debería aplicar borrado lógico (soft delete) al animal (200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/animales/${idAnimalPrincipal}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('active', false);
    });

    it('Debería retornar 404 al buscar un animal eliminado', async () => {
      const res = await request(app)
        .get(`/api/v1/animales/${idAnimalPrincipal}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});
