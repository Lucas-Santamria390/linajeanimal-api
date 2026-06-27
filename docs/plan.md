# Plan de Implementación — LinajeAnimal

> **Versión:** 1.2  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

---

## 1. Fases del Proyecto

El desarrollo se organiza en **9 fases** secuenciales, ordenadas por dependencias técnicas y optimización de arquitectura.

---

## Fase 0: Inicialización del proyecto

> **Dependencias:** Ninguna  
> **Objetivo:** Crear la estructura base del proyecto con Node.js, dependencias iniciales y entorno Dockerizado.

| #   | Tarea | Archivos involucrados | Estimación |
|-----|---|---|---|
| 0.1 | Inicializar `package.json` con `npm init` | `package.json` | 5 min |
| 0.2 | Instalar dependencias de producción | `package.json` | 5 min |
| 0.3 | Instalar dependencias de desarrollo (nodemon) | `package.json` | 2 min |
| 0.4 | Crear estructura de carpetas | `/config/`, `/middleware/`, `/models/`, `/routes/`, `/controllers/`, `/services/`, `/docs/` | 5 min |
| 0.5 | Crear `.env.example` con variables necesarias | `.env.example` | 3 min |
| 0.6 | Crear `.gitignore` (incluir `.env`, `node_modules`) | `.gitignore` | 3 min |
| 0.7 | Configurar scripts npm (`dev`, `start`, `docker`) | `package.json` | 2 min |
| 0.8 | Crear `Dockerfile` (multi-stage) | `Dockerfile` | 10 min |
| 0.9 | Crear `.dockerignore` | `.dockerignore` | 3 min |
| 0.10 | Crear `docker-compose.yml` (api + mongodb) | `docker-compose.yml` | 15 min |

**Dependencias base instaladas:**
```bash
npm install express mongoose jsonwebtoken bcryptjs helmet cors express-rate-limit express-validator dotenv morgan
npm install --save-dev nodemon

```

---

## Fase 1: Configuración y conexión a base de datos

> **Dependencias:** Fase 0
> **Objetivo:** Configurar Express, conectar MongoDB de forma segura y estructurar la inicialización del servidor.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 1.1 | Crear `config/db.js` — conexión a MongoDB con Mongoose | `config/db.js` | 10 min |
| 1.2 | Crear `config/env.js` — validación estricta de variables de entorno | `config/env.js` | 10 min |
| 1.3 | Crear `app.js` — configuración de Express (middlewares globales) | `app.js` | 15 min |
| 1.4 | Crear `server.js` — desacoplamiento del punto de entrada (`listen()`) | `server.js` | 5 min |
| 1.5 | Health check endpoint (`GET /api/v1/health`) | `routes/` + `controllers/` | 10 min |

---

## Fase 2: Modelos de datos base (Mongoose schemas)

> **Dependencias:** Fase 1
> **Objetivo:** Definir los esquemas puros de Mongoose para el almacenamiento de colecciones.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 2.1 | Crear modelo `Usuario` (con hash de password nativo) | `models/Usuario.js` | 20 min |
| 2.2 | Crear modelo `Especie` | `models/Especie.js` | 10 min |
| 2.3 | Crear modelo `Raza` (con referencia simple a Especie) | `models/Raza.js` | 10 min |
| 2.4 | Crear modelo `Animal` (esquema core con propiedades de linaje) | `models/Animal.js` | 25 min |

---

## Fase 3: CRUD de Especies y Razas

> **Dependencias:** Fase 2
> **Objetivo:** Implementar la lógica operacional y controladores para entidades maestras.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 3.1 | Crear service `EspecieService` (lógica de negocio aislada) | `services/especieService.js` | 15 min |
| 3.2 | Crear controller `EspecieController` | `controllers/especieController.js` | 10 min |
| 3.3 | Crear routes `especiesRoutes` y validaciones | `routes/especiesRoutes.js` | 10 min |
| 3.4 | Crear service `RazaService` | `services/razaService.js` | 15 min |
| 3.5 | Crear controller `RazaController` | `controllers/razaController.js` | 10 min |
| 3.6 | Crear routes `razasRoutes` y validaciones | `routes/razasRoutes.js` | 10 min |
| 3.7 | Registrar rutas maestras en `app.js` | `app.js` | 5 min |

---

## Fase 4: Autenticación y autorización

> **Dependencias:** Fase 2
> **Objetivo:** Asegurar la API mediante firma y validación de tokens JWT, control de roles e incremento de políticas de seguridad.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 4.1 | Crear `authService` (flujos de registro, login con validación de 8 caracteres mínimo) | `services/authService.js` | 25 min |
| 4.2 | Crear `authController` | `controllers/authController.js` | 10 min |
| 4.3 | Crear `routes/authRoutes` y validaciones | `routes/authRoutes.js` | 10 min |
| 4.4 | Crear middleware `auth.js` (extracción y parseo de JWT) | `middleware/auth.js` | 15 min |
| 4.5 | Crear middleware `role.js` (restricción por roles: admin, user) | `middleware/role.js` | 10 min |
| 4.6 | Crear middleware `errorHandler.js` (manejador centralizado de excepciones) | `middleware/errorHandler.js` | 10 min |
| 4.7 | Implementar Rate Limiter específico para rutas de autenticación | `middleware/rateLimiter.js` | 5 min |

---

## Fase 5: CRUD de Animales con relaciones (Migrado a Inglés) ✅

> **Dependencias:** Fases 3 y 4
> **Objetivo:** Implementar el CRUD core mapeado a la ruta `/api/v1/animals`.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 5.1 | Crear `animalService` (operaciones CRUD controlando autorías) | `services/animalService.js` | 40 min |
| 5.2 | Crear `animalController` | `controllers/animalController.js` | 15 min |
| 5.3 | Crear `routes/animalesRoutes.js` (enrutador asignado a `/animals`) | `routes/animalesRoutes.js` | 15 min |

---

## Fase 6: Rutas de dominio genealógico ✅

> **Dependencias:** Fase 5
> **Objetivo:** Implementar la lógica de herencia y construcción recursiva del árbol.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 6.1 | Implementar `GET /api/v1/animals/:id/arbol-genealogico` | `services/animalService.js` | 25 min |
| 6.2 | Implementar `GET /api/v1/animals/:id/hijos` | `services/animalService.js` | 10 min |
| 6.3 | Implementar `GET /api/v1/animals/:id/hermanos` | `services/animalService.js` | 10 min |
| 6.4 | Implementar `PATCH /api/v1/animals/:id/padres` (asociación directa) | `services/animalService.js` | 15 min |

---

## Fase 7: Administración de usuarios ✅

> **Dependencias:** Fase 4
> **Objetivo:** Habilitar endpoints de control de usuarios con respuestas estandarizadas y paginadas `{ data, pagination }`.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 7.1 | Implementar `GET /api/v1/usuarios` (paginado exclusivo para admin) | `services/usuarioService.js` | 10 min |
| 7.2 | Implementar `DELETE /api/v1/usuarios/:id` (soft delete operacional) | `services/usuarioService.js` | 10 min |

---

## Fase 8: Seed data y documentación base ✅

> **Dependencias:** Fase 6 y 7
> **Objetivo:** Poblado inicial de la base de datos distribuida y contratos Swagger iniciales.

| # | Tarea | Archivos involucrados | Estimación |
| --- | --- | --- | --- |
| 8.1 | Crear script automatizado `seed.js` | `seed.js` | 30 min |
| 8.2 | Documentación general de instalación y comandos de Docker | `README.md` | 20 min |

---

## Fase 9: Optimización de esquema, Desacoplamiento y Extended Reference (¡Completada!) ✅

> **Dependencias:** Fase 8
> **Objetivo:** Refactorizar la arquitectura eliminando operaciones concurrentes `.populate()` para cumplir con el RNF-01 (respuestas < 2s en el árbol genealógico).

| # | Tarea | Patrón Utilizado | Archivos involucrados | Estado |
| --- | --- | --- | --- | --- |
| 9.1 | Inyección de objetos embebidos parciales en `Animal` para `especie` (`{ _id, nombre }`) | **Extended Reference** | `models/Animal.js`, `services/animalService.js` | ✅ |
| 9.2 | Inyección de objetos embebidos parciales en `Animal` para `raza` (`{ _id, nombre }`) | **Extended Reference** | `models/Animal.js`, `services/animalService.js` | ✅ |
| 9.3 | Inyección de objetos embebidos parciales en `Animal` para `propietario` (`{ _id, nombre }`) | **Extended Reference** | `models/Animal.js`, `services/animalService.js` | ✅ |
| 9.4 | Traslado de lógica de sincronización: **Eliminación de Hooks `pre/post` de Mongoose** de la capa de modelos; la propagación asíncrona de cambios se ejecuta explícitamente en la capa de servicios. | **Clean Architecture** | `services/especieService.js`, `services/razaService.js` | ✅ |
| 9.5 | Depuración de consultas: Eliminación de llamadas `.populate()` redundantes en la búsqueda de listados y árbol genealógico. | **Optimización de Lecturas** | `services/animalService.js` | ✅ |
| 9.6 | Inyección de nuevos endpoints de control de sesión: `POST /auth/logout` y `PUT /auth/password`. | **Seguridad** | `routes/authRoutes.js`, `services/authService.js` | ✅ |

### Estructura final del modelo optimizado (`models/Animal.js`)

```javascript
const animalSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  especie: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Especie', required: true },
    nombre: { type: String, required: true }
  },
  raza: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Raza', required: true },
    nombre: { type: String, required: true }
  },
  propietario: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true }
  },
  padre: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null },
    nombre: { type: String },
    identificador: { type: String }
  },
  madre: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null },
    nombre: { type: String },
    identificador: { type: String }
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

```

---

## 2. Diagrama de flujo de dependencias

```
Fase 0 (Inicialización + Docker)
   │
   ▼
Fase 1 (Config/DB)
   │
   ▼
Fase 2 (Modelos)
   │
   ├──────────────────┐
   ▼                  ▼
Fase 3 (CRUD       Fase 4 (Auth)
 Especies/Razas)      │
   │                  │
   └────────┬─────────┘
            ▼
      Fase 5 (CRUD Animals - Rutas en Inglés)
            │
            ▼
      Fase 6 (Genealogía Recursiva)
            │
            ▼
      Fase 7 (Admin usuarios - Paginado)
            │
            ▼
      Fase 8 (Seed Data)
            │
            ▼
      Fase 9 (Optimización Completa: Extended Reference & Hooks a Services) [CLOSED]

```

---

## 3. Histórico de Cambios

| Versión | Fecha | Descripción | Autor |
| --- | --- | --- | --- |
| 1.0 | 2026-06-06 | Versión inicial del cronograma. | Doc Team |
| 1.1 | 2026-06-19 | Incorporación de la Fase 9 como propuesta de optimización futura. | Doc Team |
| 1.2 | 2026-06-27 | **Cierre definitivo de la Fase 9.** Se actualiza el documento reflejando la implementación real del patrón *Extended Reference*, el desuso de los hooks de Mongoose moviendo la lógica a servicios, y el cambio formal de las rutas de animales a inglés. | Saùl Ábrego |
