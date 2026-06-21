# Plan de Implementación — LinajeAnimal

> **Versión:** 1.0  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

---

## 1. Fases del Proyecto

El desarrollo se organiza en **8 fases**, ordenadas por dependencias técnicas.
Cada fase contiene tareas específicas con sus archivos a crear/modificar.

---

## Fase 0: Inicialización del proyecto

> Dependencias: ninguna  
> Objetivo: Crear la estructura base del proyecto con Node.js y las dependencias.

| #   | Tarea                                              | Archivos involucrados                    | Estimación |
|-----|----------------------------------------------------|------------------------------------------|------------|
| 0.1 | Inicializar `package.json` con `npm init`           | `package.json`                           | 5 min      |
| 0.2 | Instalar dependencias de producción                 | `package.json`                           | 5 min      |
| 0.3 | Instalar dependencias de desarrollo (nodemon)       | `package.json`                           | 2 min      |
| 0.4 | Crear estructura de carpetas                        | `/config/`, `/middleware/`, `/models/`, `/routes/`, `/controllers/`, `/services/`, `/docs/` | 5 min |
| 0.5 | Crear `.env.example` con variables necesarias       | `.env.example`                           | 3 min      |
| 0.6 | Crear `.gitignore` (incluir `.env`, `node_modules`) | `.gitignore`                             | 3 min      |
| 0.7 | Configurar scripts npm (`dev`, `start`, `docker`)   | `package.json`                           | 2 min      |
| 0.8 | Crear `Dockerfile` (multi-stage)                    | `Dockerfile`                             | 10 min     |
| 0.9 | Crear `.dockerignore`                               | `.dockerignore`                          | 3 min      |
| 0.10 | Crear `docker-compose.yml` (api + mongodb)          | `docker-compose.yml`                     | 15 min     |

**Dependencias a instalar:**
```bash
npm install express mongoose jsonwebtoken bcryptjs helmet cors express-rate-limit express-validator dotenv morgan
npm install --save-dev nodemon
```

---

## Fase 1: Configuración y conexión a base de datos

> Dependencias: Fase 0  
> Objetivo: Configurar Express, conectar MongoDB, validar variables de entorno.

| #   | Tarea                                                       | Archivos involucrados        | Estimación |
|-----|-------------------------------------------------------------|------------------------------|------------|
| 1.1 | Crear `config/db.js` — conexión a MongoDB con Mongoose      | `config/db.js`               | 10 min     |
| 1.2 | Crear `config/env.js` — validación de variables de entorno  | `config/env.js`              | 10 min     |
| 1.3 | Crear `app.js` — configuración de Express (middlewares globales) | `app.js`                 | 15 min     |
| 1.4 | Crear `server.js` — solo `listen()`                         | `server.js`                  | 5 min      |
| 1.5 | Health check endpoint (`GET /api/v1/health`)                   | `routes/` + `controllers/`   | 10 min     |

**Detalle de app.js:**
```javascript
// Middlewares a configurar:
// - dotenv (cargar .env)
// - helmet()
// - cors()
// - express.json()
// - morgan('dev') si NODE_ENV=development
// - Rate limiter global (opcional)
// - Rutas (montadas en /api)
// - Error handler (último middleware)
```

---

## Fase 2: Modelos de datos (Mongoose schemas)

> Dependencias: Fase 1  
> Objetivo: Definir los esquemas de Mongoose para todas las colecciones.

| #   | Tarea                                           | Archivos involucrados        | Estimación |
|-----|-------------------------------------------------|------------------------------|------------|
| 2.1 | Crear modelo `Usuario` (con hash de password)   | `models/Usuario.js`          | 20 min     |
| 2.2 | Crear modelo `Especie`                          | `models/Especie.js`          | 10 min     |
| 2.3 | Crear modelo `Raza` (con referencia a Especie)  | `models/Raza.js`             | 10 min     |
| 2.4 | Crear modelo `Animal` (con padres, especie, raza, propietario) | `models/Animal.js` | 25 min |

**Detalle del modelo Animal:**
```javascript
// Campos clave:
// nombre: String, required
// especie: ObjectId, ref: 'Especie', required
// raza: ObjectId, ref: 'Raza', required
// sexo: String, enum: ['macho', 'hembra'], required
// fechaNacimiento: Date, required
// peso: Number
// color: String
// identificador: String, unique sparse
// fotoUrl: String
// notas: String
// padre: ObjectId, ref: 'Animal', default: null
// madre: ObjectId, ref: 'Animal', default: null
// propietario: ObjectId, ref: 'Usuario', required
// active: Boolean, default: true
// timestamps: true
```

---

## Fase 3: CRUD de Especies y Razas

> Dependencias: Fase 2  
> Objetivo: Implementar operaciones CRUD completas para Especie y Raza (solo admin).

| #   | Tarea                                              | Archivos involucrados                         | Estimación |
|-----|----------------------------------------------------|-----------------------------------------------|------------|
| 3.1 | Crear service `EspecieService` (lógica de negocio) | `services/especieService.js`                  | 15 min     |
| 3.2 | Crear controller `EspecieController` (delgado)     | `controllers/especieController.js`            | 10 min     |
| 3.3 | Crear routes `especiesRoutes` y validaciones       | `routes/especiesRoutes.js`                    | 10 min     |
| 3.4 | Crear service `RazaService`                        | `services/razaService.js`                     | 15 min     |
| 3.5 | Crear controller `RazaController`                  | `controllers/razaController.js`               | 10 min     |
| 3.6 | Crear routes `razasRoutes` y validaciones          | `routes/razasRoutes.js`                       | 10 min     |
| 3.7 | Registrar rutas en `app.js`                        | `app.js`                                      | 5 min      |

**Endpoints a implementar:**
- `POST /api/v1/especies`, `GET /api/v1/especies`, `GET /api/v1/especies/:id`, `PUT /api/v1/especies/:id`, `DELETE /api/v1/especies/:id`
- `POST /api/v1/razas`, `GET /api/v1/razas`, `GET /api/v1/razas/:id`, `PUT /api/v1/razas/:id`, `DELETE /api/v1/razas/:id`

**Validaciones comunes:**
- nombre requerido y no vacío
- ObjectId válido antes de consultar
- Verificar existencia antes de update/delete
- Soft delete: usar `findByIdAndUpdate` con `{ active: false }`

---

## Fase 4: Autenticación y autorización

> Dependencias: Fase 2 (modelo Usuario)  
> Objetivo: Implementar registro, login, JWT, y middleware de roles.

| #   | Tarea                                                     | Archivos involucrados                         | Estimación |
|-----|-----------------------------------------------------------|-----------------------------------------------|------------|
| 4.1 | Crear `authService` (registro, login, perfil)              | `services/authService.js`                     | 25 min     |
| 4.2 | Crear `authController`                                     | `controllers/authController.js`               | 10 min     |
| 4.3 | Crear `routes/authRoutes` y validaciones                   | `routes/authRoutes.js`                        | 10 min     |
| 4.4 | Crear middleware `auth.js` (verificar token JWT)           | `middleware/auth.js`                           | 15 min     |
| 4.5 | Crear middleware `role.js` (verificar rol)                 | `middleware/role.js`                           | 10 min     |
| 4.6 | Crear middleware `errorHandler.js` (centralizado)          | `middleware/errorHandler.js`                   | 10 min     |
| 4.8 | Rate limiter para rutas de auth                            | `middleware/rateLimiter.js` o en `app.js`      | 5 min      |
| 4.9 | Registrar rutas de auth en `app.js`                        | `app.js`                                      | 5 min      |

**Endpoints:**
- `POST /api/v1/auth/register` — público, crea usuario (rol `user` por defecto)
- `POST /api/v1/auth/login` — público, devuelve JWT
- `GET /api/v1/auth/profile` — requiere auth, devuelve perfil

**Middleware de auth (flujo):**
1. Extraer token de `Authorization: Bearer <token>`
2. Verificar con `jwt.verify(token, JWT_SECRET)`
3. Buscar usuario en BD
4. Adjuntar `req.usuario` con datos del usuario
5. Si no es válido → `401 Unauthorized`

**Middleware de role (flujo):**
1. Recibir array de roles permitidos: `authorize('admin')` o `authorize('admin', 'user')`
2. Comparar `req.usuario.rol` con roles permitidos
3. Si no coincide → `403 Forbidden`

---

## Fase 5: CRUD de Animales con relaciones ✅

> Dependencias: Fases 3 y 4  
> Objetivo: Implementar CRUD completo de Animales con validaciones de parentesco.

| #   | Tarea                                                        | Archivos involucrados                         | Estimación |
|-----|--------------------------------------------------------------|-----------------------------------------------|------------|
| 5.1 | Crear `animalService` (CRUD + lógica de parentesco)          | `services/animalService.js`                   | 40 min     |
| 5.2 | Crear `animalController`                                      | `controllers/animalController.js`             | 15 min     |
| 5.3 | Crear `routes/animalesRoutes` con validaciones               | `routes/animalesRoutes.js`                    | 15 min     |
| 5.4 | Registrar rutas de animales en `app.js`                      | `app.js`                                      | 5 min      |

**Endpoints base:**
- `POST /api/v1/animales` — crear animal (asigna `propietario` = usuario autenticado)
- `GET /api/v1/animales` — listar (con filtros: especie, raza, sexo, propietario, activo)
- `GET /api/v1/animales/:id` — detalle (populate de especie, raza, padre, madre, propietario)
- `PUT /api/v1/animales/:id` — actualizar (solo admin o propietario)
- `DELETE /api/v1/animales/:id` — soft delete (solo admin o propietario)

**Validaciones específicas de Animal:**
- `especie` y `raza` deben ser ObjectId válidos
- `sexo` debe ser `macho` o `hembra`
- `fechaNacimiento` debe ser una fecha válida, no futura (⚠️ pendiente de implementar en modelo o service)
- `padre` si se proporciona: debe existir, ser activo, de sexo `macho`, misma especie
- `madre` si se proporciona: debe existir, ser activa, de sexo `hembra`, misma especie
- `identificador` único (índice sparse, permite múltiples nulls)
- El usuario autenticado se asigna automáticamente como `propietario`

**Autorización:**
- Admin: CRUD completo sobre cualquier animal
- User: CRUD solo sobre animales donde `propietario` = su ID
- Lectura (GET): cualquier usuario autenticado puede ver cualquier animal activo

---

## Fase 6: Rutas de dominio genealógico ✅

> Dependencias: Fase 5  
> Objetivo: Implementar endpoints específicos de genealogía (árbol, hijos, hermanos, padres).

| #   | Tarea                                                        | Archivos involucrados                         | Estimación |
|-----|--------------------------------------------------------------|-----------------------------------------------|------------|
| 6.1 | Implementar `GET /api/v1/animales/:id/arbol-genealogico`        | `services/animalService.js` + controller       | 25 min     |
| 6.2 | Implementar `GET /api/v1/animales/:id/hijos`                    | `services/animalService.js` + controller       | 10 min     |
| 6.3 | Implementar `GET /api/v1/animales/:id/hermanos`                 | `services/animalService.js` + controller       | 10 min     |
| 6.4 | Implementar `PATCH /api/v1/animales/:id/padres` (asignar padres)| `services/animalService.js` + controller       | 15 min     |
| 6.5 | Agregar rutas a `routes/animalesRoutes.js`                  | `routes/animalesRoutes.js`                     | 5 min      |

**Detalle del árbol genealógico:**
```javascript
// Lógica recursiva con profundidad configurable (default 3, max 5)
async function construirArbol(animalId, profundidad = 3, actual = 0) {
  if (actual >= profundidad) return null;
  const animal = await Animal.findById(animalId).populate('padre madre');
  if (!animal) return null;
  
  return {
    id: animal._id,
    nombre: animal.nombre,
    sexo: animal.sexo,
    padre: await construirArbol(animal.padre?._id, profundidad, actual + 1),
    madre: await construirArbol(animal.madre?._id, profundidad, actual + 1)
  };
}
```

**Detalle de asignación de padres:**
- Validar que padre y madre no sean el mismo animal
- Validar que padre no sea descendiente del animal (prevención de ciclos)
- Validar que madre no sea descendiente del animal
- Actualizar campos `padre` y `madre` en el documento

---

## Fase 7: Administración de usuarios (solo admin) ✅

> Dependencias: Fase 4  
> Objetivo: Endpoints para que admin gestione usuarios.

| #   | Tarea                                                   | Archivos involucrados        | Estimación |
|-----|---------------------------------------------------------|------------------------------|------------|
| 7.1 | Implementar `GET /api/v1/usuarios` (listar usuarios)       | service + controller + route | 10 min     |
| 7.2 | Implementar `DELETE /api/v1/usuarios/:id` (soft delete) | service + controller + route | 10 min     |
| 7.3 | Registrar rutas de usuarios en `app.js`                 | `app.js`                     | 5 min      |

---

## Fase 8: Seed data y documentación (parcial)

> Dependencias: Fase 6 (todas las entidades creadas)  
> Objetivo: Poblar la BD con datos de ejemplo y generar documentación de la API.

| #   | Tarea                                                      | Archivos involucrados                | Estimación |
|-----|------------------------------------------------------------|--------------------------------------|------------|
| 8.1 | Crear script `seed.js` en raíz                              | `seed.js`                            | 30 min     |
| 8.2 | Crear Postman Collection (`postman_collection.json`)        | `postman_collection.json`            | 30 min     |
| 8.3 | Crear `README.md` con instrucciones de instalación y uso   | `README.md`                          | 20 min     |
| 8.4 | Verificar que `.env.example` está completo                  | `.env.example`                       | 5 min      |
| 8.5 | Verificar que `.gitignore` ignora `.env` y `node_modules`   | `.gitignore`                         | 3 min      |

**Seed data sugerida:**
- 2 usuarios: 1 admin, 1 user
- 3 especies: Canino, Felino, Equino
- 6 razas: Labrador, Pastor Alemán (Canino); Persa, Siamés (Felino); Árabe, Pura Sangre (Equino)
- 10+ animales con relaciones de parentesco que formen un árbol genealógico de 3 generaciones
- Los animales deben tener diferentes estados: activos y al menos 1 desactivado

---

### Docker Compose (modo recomendado)

Docker Compose es el método principal de ejecución. Un solo comando levanta
la API y MongoDB sin instalar nada en el host.

**Archivos creados en Fase 0:**

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Multi-stage (`node:20-alpine`, tini, usuario no-root) |
| `.dockerignore` | Excluye `node_modules`, `.env`, `docs/`, `*.md` |
| `docker-compose.yml` | Servicios `api` + `mongodb` con healthcheck y volumen |

**Modos de ejecución:**

| Modo | Comando | Requisitos |
|------|---------|------------|
| **Docker Compose** 🐳 | `npm run docker` | Docker + Docker Compose (recomendado) |
| **Local** | `npm run dev` | Node.js ≥ 18, MongoDB local |

Al usar Docker Compose, el `MONGODB_URI` del `.env` se sobreescribe via variable
de entorno en el contenedor `api`, apuntando al hostname `mongodb` (nombre del servicio).

---

## 2. Diagrama de dependencias entre fases

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
Fase 3 (CRUD         Fase 4 (Auth)
 Especies/Razas)        │
   │                    │
   └────────┬───────────┘
            ▼
      Fase 5 (CRUD Animales)
            │
            ▼
      Fase 6 (Genealogía)
            │
            ▼
      Fase 7 (Admin usuarios)
            │
            ▼
      Fase 8 (Seed + Docs)
```

Docker Compose se crea en la **Fase 0** (tareas 0.8-0.10) y el `docker-compose.yml`
incluye el servicio `mongodb`, por lo que no se necesita MongoDB instalado en el host.

---

## 3. Resumen de archivos a crear

```
/
├── package.json                  # Fase 0 ✅
├── .env.example                  # Fase 0 ✅
├── .gitignore                    # Fase 0 ✅
├── server.js                     # Fase 1 (solo listen()) ✅
├── app.js                        # Fase 1 (config Express) ✅
├── seed.js                       # Fase 8 ❌ pendiente
├── postman_collection.json       # Fase 8 ❌ pendiente
├── README.md                     # Fase 8 ✅
│
├── config/
│   ├── db.js                     # Fase 1 ✅
│   ├── env.js                    # Fase 1 ✅
│   └── swagger.js                # Fase 8 ✅
│
├── middleware/
│   ├── auth.js                   # Fase 4 ✅
│   ├── role.js                   # Fase 4 ✅
│   ├── rateLimiter.js            # Fase 4 ✅
│   └── errorHandler.js           # Fase 4 ✅
│
├── models/
│   ├── Usuario.js                # Fase 2 ✅
│   ├── Especie.js                # Fase 2 ✅
│   ├── Raza.js                   # Fase 2 ✅
│   └── Animal.js                 # Fase 2 ✅
│
├── services/
│   ├── authService.js            # Fase 4 ✅
│   ├── especieService.js         # Fase 3 ✅
│   ├── razaService.js            # Fase 3 ✅
│   ├── animalService.js          # Fase 5 y 6 ✅
│   └── usuarioService.js         # Fase 7 ✅
│
├── controllers/
│   ├── authController.js         # Fase 4 ✅
│   ├── especieController.js      # Fase 3 ✅
│   ├── razaController.js         # Fase 3 ✅
│   ├── animalController.js       # Fase 5 y 6 ✅
│   └── usuarioController.js      # Fase 7 ✅
│
├── routes/
│   ├── authRoutes.js             # Fase 4 ✅
│   ├── especiesRoutes.js         # Fase 3 ✅
│   ├── razasRoutes.js            # Fase 3 ✅
│   ├── animalesRoutes.js         # Fase 5 y 6 ✅
│   ├── usuariosRoutes.js         # Fase 7 ✅
│   └── healthRoutes.js           # Fase 1 (inline en app.js) ✅
│
├── Dockerfile                    # Fase 0 ✅
├── .dockerignore                 # Fase 0 ✅
├── docker-compose.yml            # Fase 0 ✅
│
└── docs/
    ├── requisitos.md             # Documentación ✅
    ├── casos-de-uso.md           # Documentación ✅
    ├── modelo-de-datos.md        # Documentación ✅
    ├── plan.md                   # Documentación ✅
    └── swagger/
        ├── auth.yml              # Documentación ✅
        ├── especies.yml          # Documentación ✅
        ├── razas.yml             # Documentación ✅
        ├── animales.yml          # Documentación ✅
        └── usuarios.yml          # Documentación ✅
```

---

## 4. Checklist de verificación (alineado con rúbrica)

| #   | Requisito                                        | Fase | Estado |
|-----|--------------------------------------------------|------|--------|
| 1   | Estructura de carpetas según rúbrica              | 0    | ✅ |
| 2   | server.js y app.js separados                      | 1    | ✅ |
| 3   | Capa services/ separada                           | 3-7  | ✅ |
| 4   | Auth routes: register, login, profile             | 4    | ✅ |
| 5   | JWT + bcrypt (salt ≥ 10)                          | 4    | ✅ |
| 6   | Role middleware (401, 403)                        | 4    | ✅ |
| 7   | Soft deletes (active: Boolean)                    | 3-7  | ✅ |
| 8   | Centralized error handler                         | 4    | ✅ |
| 9   | Validaciones (email, password, enums, ObjectId)   | 3-5  | ✅ |
| 10  | Rate limiting en auth routes                      | 4    | ✅ |
| 11  | Helmet, CORS                                      | 1    | ✅ |
| 12  | Sin password en respuestas                        | 2    | ✅ |
| 13  | Seed data                                         | 8    | ❌ |
| 14  | Postman collection o Swagger                      | 8    | ✅ (Swagger: auth, especies, razas, animales, usuarios) |
| 15  | .env.example presente                             | 0    | ✅ |
| 16  | Health check endpoint                             | 1    | ✅ |
| 17  | README completo                                   | 8    | ✅ |
| 18  | Docker Compose (api + mongodb)                     | 0    | ✅ |
| 19  | Dockerfile multi-stage                              | 0    | ✅ |
| 20  | Healthcheck MongoDB en docker-compose               | 0    | ✅ |

---

## 5. Fase 9 — Optimización de esquema MongoDB (futuro sprint)

> Dependencias: Fase 8  
> Objetivo: Optimizar el diseño de documentos según patrones MongoDB para reducir consultas y mejorar rendimiento.

| #   | Tarea                                                              | Patrón            | Archivos involucrados      | Estimación |
|-----|--------------------------------------------------------------------|-------------------|----------------------------|------------|
| 9.1 | Agregar Extended Reference en `Animal` para `especie` (`{ _id, nombre }`) | Extended Reference | `models/Animal.js`, `services/animalService.js`, seed | 20 min |
| 9.2 | Agregar Extended Reference en `Animal` para `raza` (`{ _id, nombre }`)     | Extended Reference | `models/Animal.js`, `services/animalService.js`, seed | 15 min |
| 9.3 | Agregar Extended Reference en `Animal` para `propietario` (`{ _id, nombre, email }`) | Extended Reference | `models/Animal.js`, `services/animalService.js`, seed | 15 min |
| 9.4 | Agregar campo computado `cantidadHijos` en `Animal` con `$inc`       | Computed          | `models/Animal.js`, `services/animalService.js` | 20 min |
| 9.5 | Agregar campo computado `cantidadAnimales` en `Especie` y `Raza`    | Computed          | `models/Especie.js`, `models/Raza.js`, services | 20 min |
| 9.6 | Sincronización: hook `post('save')` en `Especie` para actualizar nombres en `Animal` | Extended Reference | `models/Especie.js`, `services/animalService.js` | 15 min |
| 9.7 | Sincronización: hook `post('save')` en `Raza` para actualizar nombres en `Animal` | Extended Reference | `models/Raza.js`, `services/animalService.js` | 15 min |
| 9.8 | Migración: script para backfill de datos existentes                | —                 | `scripts/migrate-v2.js`    | 30 min |
| 9.9 | Eliminar `populate` redundantes en `animalService` (especie, raza, propietario) | —                 | `services/animalService.js` | 10 min |
| 9.10 | Agregar índices compuestos faltantes según queries de la app       | —                 | Modelos                   | 10 min |

**Total estimado:** 2h 50min

### Detalle de cambios planeados

```javascript
// models/Animal.js — después de Fase 9
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
    nombre: { type: String, required: true },
    email: { type: String, required: true }
  },
  padre: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null },
  madre: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null },
  cantidadHijos: { type: Number, default: 0 },
  // ... resto de campos igual
});
```

```javascript
// En animalService.create — actualizar cantidadHijos del padre/madre
if (payload.padre) {
  await Animal.findByIdAndUpdate(payload.padre, { $inc: { cantidadHijos: 1 } });
}
if (payload.madre) {
  await Animal.findByIdAndUpdate(payload.madre, { $inc: { cantidadHijos: 1 } });
}
```

### Efecto esperado

| Consulta | Antes (populates) | Después (populates) | Mejora |
|---|---|---|---|
| `GET /api/v1/animales` | 5 por documento | 2 (padre, madre) | −60% |
| `GET /api/v1/animales/:id` | 5 | 2 (padre, madre) | −60% |
| `GET /arbol-genealogico/:id` | 5 por nodo | 0 (todo en el doc) | −100% |
| `GET /:id/hijos` | 1 query + 5 populates | 1 query + 2 populates | −60% |

---

## 6. Histórico de Cambios

| Versión | Fecha      | Descripción            | Autor  |
|---------|------------|------------------------|--------|
| 1.0     | 2026-06-06 | Versión inicial                          | Doc Team |
| 1.1     | 2026-06-19 | Agregada Fase 9 — Optimización MongoDB   | Doc Team |
