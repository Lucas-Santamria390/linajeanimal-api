# LinajeAnimal API

API REST para la gestión de árboles genealógicos de animales. Permite registrar animales, definir relaciones de parentesco, consultar linajes completos y administrar especies y razas.

## Stack tecnológico

| Tecnología | Propósito |
|------------|-----------|
| Node.js + Express | Servidor web |
| MongoDB + Mongoose | Base de datos y ODM |
| JWT (jsonwebtoken) | Autenticación |
| bcryptjs | Hash de contraseñas |
| express-validator | Validación de datos |
| helmet | Seguridad HTTP |
| cors | Control de acceso CORS |
| express-rate-limit | Protección contra fuerza bruta |
| Docker | Entorno reproducible |

## Arquitectura del proyecto

La API sigue una arquitectura en capas:

```
Cliente → [Routes] → [Controllers] → [Services] → [Models] → MongoDB
                 ↕                              ↕
            [Middleware]              [Extended Reference]
         (auth, role, rateLimit,    (especie, raza, propietario
          validation, errorHandler)   embebidos en Animal)
```

- **`server.js`** — solo inicia el servidor con `listen()`
- **`app.js`** — configura Express (middlewares globales, rutas, manejador de errores)
- **`routes/`** — define las rutas HTTP y aplica validaciones con `express-validator`
- **`controllers/`** — controladores delgados que reciben el request y delegan en services
- **`services/`** — lógica de negocio pura (CRUD, reglas de parentesco, árbol genealógico)
- **`models/`** — esquemas Mongoose con validación a nivel de documento
- **`middleware/`** — autenticación JWT, autorización por roles, rate limiting, manejo centralizado de errores

## Modelo de datos

El sistema utiliza **MongoDB** con 4 colecciones principales:

```
┌──────────────────┐          ┌──────────────────┐
│     Usuario      │          │     Especie      │
│──────────────────│          │──────────────────│
│ _id              │          │ _id              │
│ nombre           │          │ nombre (único)   │
│ email (único)    │          │ descripcion      │
│ password (hash)  │          │ active           │
│ rol (admin/user) │          └────────┬─────────┘
│ active           │                   │
│ tokenVersion     │                   │ 1
└────────┬─────────┘                   │
         │                            │
         │ 1               ┌──────────┴──────────┐
         │                 │        Raza          │
         │                 │──────────────────────│
         │                 │ _id                  │
         │                 │ nombre               │
         │                 │ descripcion          │
         │                 │ especie ─────────────┘
         │                 │ active
         │                 └──────────┬───────────┘
         │                            │ N
         │ *                          │
         │      ┌─────────────────────┴──────────────┐
         │      │             Animal                  │
         └──────┤ propietario (Extended Ref)         │
                │ especie (Extended Ref) ───────────►│ Especie
                │ raza (Extended Ref) ──────────────►│ Raza
                │ sexo (macho/hembra)                 │
                │ fechaNacimiento                     │
                │ identificador (único x propietario) │
                │ padre ──── auto-ref (ObjectId)      │
                │ madre ──── auto-ref (ObjectId)      │
                │ cantidadHijos (computado)           │
                │ active                              │
                └─────────────────────────────────────┘
```

**Estrategias de modelado:**

| Patrón | Aplicación |
|--------|-----------|
| **Parent References** | Padre/madre como `ObjectId` ref a Animal — permite navegación ascendente rápida |
| **Extended Reference** | `especie`, `raza` y `propietario` se almacenan como objetos embebidos `{ _id, nombre }` para reducir `.populate()` de 5 a 2 |
| **Soft Delete** | Todas las entidades tienen `active: Boolean` (default `true`). Ninguna operación elimina físicamente |
| **Campo Computado** | `cantidadHijos` en Animal se actualiza con `$inc` al asignar padres |
| **Timestamps** | `createdAt` y `updatedAt` automáticos en todos los modelos |

## Reglas de negocio

| Regla | Implementación |
|-------|---------------|
| El padre debe ser de sexo `macho` y la madre de sexo `hembra` | Service layer |
| Padre y madre deben pertenecer a la misma especie que el hijo | Service layer |
| Un animal no puede ser su propio padre/madre ni formar ciclos | Validación recursiva con profundidad máxima |
| Solo los administradores pueden crear/editar especies y razas | Role middleware (`authorize('admin')`) |
| Un usuario `user` solo puede modificar animales donde sea `propietario` | Verificación en service |
| El email debe tener formato válido y password ≥ 8 caracteres (mayúscula, número, especial) | express-validator + regex |
| Todos los ObjectId se validan antes de consultar la BD | express-validator con `isMongoId()` |
| No se exponen contraseñas en respuestas de la API | `select: false` en esquema Mongoose |

## Flujo de autenticación

```
Registro:  POST /api/v1/auth/register
             → validar email + password
             → hash bcrypt (salt 10)
             → crear usuario (rol "user" por defecto)
             → 201 Created (sin password)

Login:     POST /api/v1/auth/login
             → verificar credenciales
             → generar JWT { id, rol, tokenVersion } (expira: 7 días)
             → 200 OK + token + datos usuario

Request protejido:
             → Authorization: Bearer <token>
             → auth middleware: verifica JWT + busca usuario activo
             → adjunta req.usuario
             → 401 si token inválido/expirado

Logout / Cambio de password:
             → incrementa tokenVersion en BD
             → todos los tokens anteriores quedan inválidos
```

## Ejemplos de uso

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@linajeanimal.test", "password": "Admin123!"}'
```

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "usuario": { "_id": "...", "nombre": "Admin", "email": "admin@linajeanimal.test", "rol": "admin" }
  }
}
```

### Crear un animal

```bash
curl -X POST http://localhost:3000/api/v1/animales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "identificador": "BOV-001",
    "nombre": "Torito",
    "especie": { "_id": "ID_ESPECIE", "nombre": "Bovino" },
    "raza": { "_id": "ID_RAZA", "nombre": "Angus" },
    "sexo": "macho",
    "fechaNacimiento": "2023-05-10",
    "peso": 450
  }'
```

```json
{
  "success": true,
  "data": { "_id": "...", "identificador": "BOV-001", "nombre": "Torito", "sexo": "macho", ... }
}
```

### Consultar árbol genealógico

```bash
curl -X GET http://localhost:3000/api/v1/animales/ID_ANIMAL/family-tree?generaciones=3 \
  -H "Authorization: Bearer <token>"
```

```json
{
  "success": true,
  "data": {
    "generaciones": 3,
    "arbol": {
      "_id": "...",
      "identificador": "BOV-001",
      "nombre": "Torito",
      "padre": { "_id": "...", "identificador": "BOV-000", "nombre": "Toro Padre", "padre": null, "madre": null },
      "madre": { "_id": "...", "identificador": "BOV-100", "nombre": "Vaca Madre", "padre": null, "madre": null }
    }
  }
}
```

## Documentación detallada

La documentación completa del proyecto se encuentra en la carpeta `docs/`:

| Archivo | Contenido |
|---------|-----------|
| [`docs/requisitos.md`](docs/requisitos.md) | Requisitos funcionales y no funcionales, roles, restricciones técnicas |
| [`docs/casos-de-uso.md`](docs/casos-de-uso.md) | Casos de uso con flujos normales/alternos y ejemplos de respuesta |
| [`docs/modelo-de-datos.md`](docs/modelo-de-datos.md) | Esquemas detallados, índices, validaciones de dominio y seguridad |
| [`docs/swagger/`](docs/swagger/) | Especificaciones OpenAPI para cada recurso (auth, especies, razas, animales, usuarios) |

## Requisitos previos

- **Opción A (recomendada):** Docker + Docker Compose
- **Opción B (local):** Node.js >= 18, MongoDB instalado y corriendo

## Inicio rápido (Docker — recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/Lucas-Santamaria390/linajeanimal-api.git
cd linajeanimal-api

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env: cambiar JWT_SECRET y credenciales de MongoDB

# 3. Levantar todo (API + MongoDB)
npm run docker
```

La API estará disponible en `http://localhost:3000`.

## Inicio local (alternativa)

```bash
# 1. Clonar e instalar dependencias
git clone https://github.com/Lucas-Santamaria390/linajeanimal-api.git
cd linajeanimal-api
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env: asegurar que MONGODB_URI apunte a tu MongoDB local

# 3. Iniciar en modo desarrollo
npm run dev
```

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno (development/production) | `development` |
| `MONGODB_URI` | Cadena de conexión a MongoDB | `mongodb://localhost:27017/linajeanimal` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | *(obligatorio)* |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` |
| `MONGO_ROOT_USERNAME` | Usuario root de MongoDB (Docker) | `root` |
| `MONGO_ROOT_PASSWORD` | Password root de MongoDB (Docker) | `rootpass` |
| `MONGO_PORT` | Puerto de MongoDB (Docker) | `27017` |

## Endpoints de la API

### Autenticación

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/v1/auth/register` | No | — | Registrar usuario |
| POST | `/api/v1/auth/login` | No | — | Iniciar sesión |
| GET | `/api/v1/auth/profile` | Sí | — | Perfil del usuario autenticado |
| PUT | `/api/v1/auth/password` | Sí | — | Actualizar contraseña |
| POST | `/api/v1/auth/logout` | Sí | — | Cerrar sesión |

### Especies

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/v1/especies` | No | — | Listar especies (filtro `?active=true/false`) |
| GET | `/api/v1/especies/:id` | No | — | Detalle de especie |
| POST | `/api/v1/especies` | Sí | admin | Crear especie |
| PUT | `/api/v1/especies/:id` | Sí | admin | Actualizar especie |
| DELETE | `/api/v1/especies/:id` | Sí | admin | Desactivar especie |
| PATCH | `/api/v1/especies/:id` | Sí | admin | Activar/desactivar especie |

### Razas

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/v1/razas` | No | — | Listar razas (filtros `?especie=id`, `?active=true/false`) |
| GET | `/api/v1/razas/:id` | No | — | Detalle de raza |
| POST | `/api/v1/razas` | Sí | admin | Crear raza |
| PUT | `/api/v1/razas/:id` | Sí | admin | Actualizar raza |
| DELETE | `/api/v1/razas/:id` | Sí | admin | Desactivar raza |
| PATCH | `/api/v1/razas/:id` | Sí | admin | Activar/desactivar raza |

### Animales

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/v1/animales` | Sí | — | Crear animal |
| GET | `/api/v1/animales` | Sí | — | Listar animales |
| GET | `/api/v1/animales/:id` | Sí | — | Detalle de animal |
| PUT | `/api/v1/animales/:id` | Sí | — | Actualizar animal |
| DELETE | `/api/v1/animales/:id` | Sí | admin | Desactivar animal |
| POST | `/api/v1/animales/:id/parents` | Sí | — | Asignar o desasignar padres |
| GET | `/api/v1/animales/:id/family-tree` | Sí | — | Árbol genealógico |
| GET | `/api/v1/animales/:id/children` | Sí | — | Hijos directos |
| GET | `/api/v1/animales/:id/siblings` | Sí | — | Hermanos |

### Usuarios

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/v1/usuarios` | Sí | admin | Listar usuarios (paginado) |
| POST | `/api/v1/usuarios` | Sí | admin | Crear usuario |
| GET | `/api/v1/usuarios/:id` | Sí | admin | Detalle de usuario |
| PUT | `/api/v1/usuarios/:id` | Sí | admin | Actualizar usuario |
| DELETE | `/api/v1/usuarios/:id` | Sí | admin | Desactivar usuario (soft delete) |
| PATCH | `/api/v1/usuarios/:id` | Sí | admin | Activar/desactivar usuario |

### Utilidades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/docs` | Documentación Swagger |

## Documentación interactiva

La API está desplegada en:

```
https://linajeanimal-api.onrender.com
```

Documentación Swagger disponible en:

```
http://localhost:3000/api/v1/docs
https://linajeanimal-api.onrender.com/api/v1/docs
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run docker` | Levantar API + MongoDB con Docker Compose |
| `npm run dev` | Iniciar en modo desarrollo con nodemon |
| `npm start` | Iniciar en modo producción |
| `npm run seed` | Poblar la base de datos con datos de prueba |

## Estructura del proyecto

```
/
├── config/          # Conexión a BD, variables de entorno, Swagger
├── controllers/     | Controladores (delegan en services/)
├── middleware/      # Auth JWT, roles, validación, rate limiting, errores
├── models/          # Esquemas de Mongoose (Usuario, Especie, Raza, Animal)
├── routes/          # Rutas de Express con validaciones
├── services/        # Lógica de negocio
├── docs/            # Documentación del proyecto
├── server.js        # Punto de entrada (listen)
├── app.js           # Configuración de Express
├── Dockerfile       # Imagen multi-stage
├── docker-compose.yml  # Servicios API + MongoDB
└── seed.js          # Script de seed con datos de prueba
```

## Seed de prueba

El script `npm run seed` limpia las colecciones principales y crea datos de ejemplo
para:

- **3 usuarios** de prueba: `admin`, `juan` y `maria`
- **5 especies**: `Bovino`, `Ovino`, `Caprino`, `Porcino` y `Equino`
- **14 razas** vinculadas a sus especies (Angus, Hereford, Holstein, Dorper, Merino, etc.)
- **25 animales**, incluyendo árboles genealógicos de 3 generaciones

Cada usuario normal (`juan` y `maria`) tiene **10 animales Bovino** con sus propios árboles
genealógicos independientes (líneas Angus, Hereford y Holstein), sin mezclar propietarios.
El admin posee 1 animal por especie a modo de demostración.

Credenciales creadas por el seed:

- `admin@linajeanimal.test` / `Admin123!`
- `juan@linajeanimal.test` / `User123!`
- `maria@linajeanimal.test` / `User123!`

## Licencia

MIT
