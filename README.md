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

### Especies

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/v1/especies` | No | — | Listar especies |
| GET | `/api/v1/especies/:id` | No | — | Detalle de especie |
| POST | `/api/v1/especies` | Sí | admin | Crear especie |
| PUT | `/api/v1/especies/:id` | Sí | admin | Actualizar especie |
| DELETE | `/api/v1/especies/:id` | Sí | admin | Desactivar especie |

### Razas

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/api/v1/razas` | No | — | Listar razas (filtro `?especie=id`) |
| GET | `/api/v1/razas/:id` | No | — | Detalle de raza |
| POST | `/api/v1/razas` | Sí | admin | Crear raza |
| PUT | `/api/v1/razas/:id` | Sí | admin | Actualizar raza |
| DELETE | `/api/v1/razas/:id` | Sí | admin | Desactivar raza |

### Animales

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| POST | `/api/v1/animales` | Sí | — | Crear animal |
| GET | `/api/v1/animales` | Sí | — | Listar animales |
| GET | `/api/v1/animales/:id` | Sí | — | Detalle de animal |
| PUT | `/api/v1/animales/:id` | Sí | — | Actualizar animal |
| DELETE | `/api/v1/animales/:id` | Sí | — | Desactivar animal |
| POST | `/api/v1/animales/:id/padres` | Sí | — | Asignar o desasignar padres |
| PATCH | `/api/v1/animales/:id/padres` | Sí | — | Asignar o desasignar padres (alias) |
| GET | `/api/v1/animales/:id/arbol-genealogico` | Sí | — | Árbol genealógico |
| GET | `/api/v1/animales/:id/hijos` | Sí | — | Hijos directos |
| GET | `/api/v1/animales/:id/hermanos` | Sí | — | Hermanos |

### Utilidades

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/docs` | Documentación Swagger |

## Documentación interactiva

La API cuenta con documentación Swagger disponible en:

```
http://localhost:3000/api/v1/docs
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run docker` | Levantar API + MongoDB con Docker Compose |
| `npm run dev` | Iniciar en modo desarrollo con nodemon |
| `npm start` | Iniciar en modo producción |

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
└── seed.js          # Datos de prueba (próximamente)
```

## Licencia

MIT
