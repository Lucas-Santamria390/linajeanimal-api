# DS-Parcial2 — LinajeAnimal (Express REST API)

**Domain**: animal genealogy tree API. Entities: Animal (parent/child), Especie, Raza. Two roles: admin, user.

## Branches

- `main` — stable
- `develop` — active development
- CI (`.github/workflows/ci.yml`) triggers on push/PR to both.

## Project structure

```
/
├── config/          # DB connection, env validation, Swagger
├── middleware/       # auth, role, errorHandler, rateLimiter
├── models/          # Mongoose schemas (Usuario, Especie, Raza, Animal)
├── routes/          # Express routers + express-validator inline
├── controllers/     # thin try/catch → next(err), delegate to services/
├── services/        # business logic, existence + active checks
├── server.js        # listen() after connectDB
├── app.js           # Express setup (no listen)
├── .env.example
└── README.md
```

## Key architecture (easy to miss)

- **Password security**: `select: false` on `password`, `toJSON()` strips it, `pre('save')` bcrypt hash (salt=10)
- **Soft deletes**: `findByIdAndUpdate` with `{ active: false }` — never `deleteOne`/`deleteMany`
- **ObjectId validation**: routes use `param('id').isMongoId()` via express-validator inline — no separate middleware file
- **Controller pattern**: every method `try/catch { next(err) }`, always delegates to services, never touches models
- **Service pattern**: services do existence + active checks, throw errors with `err.statusCode` set
- **Service naming**: all service/controller functions named in **English** (`list`, `create`, `getById`, `update`, `remove`)
- **Error handler**: `ValidationError`→400, `CastError`→400, duplicate key 11000→409, no stack in production
- **Auth limiter**: 10 req / 15 min on register + login only (profile is not rate-limited)
- **Response format**: `{ success: true, data: ... }` on success, `{ success: false, message: "..." }` on error (always `message`, never `errors`)
- **Validación inline**: `validarCampos` helper (checking `validationResult`) is defined inline in every route file, not as shared middleware — replicate when adding new route files
- **JWT payload**: `{ id, rol }` (not `role`), expires in 7 days
- **Role middleware**: `authorize('admin')` checks `req.usuario.rol` — returns 401 if no token, 403 if wrong role
- **Animal model gap**: `fechaNacimiento` has no "no future dates" validator (required in plan, not implemented in model yet)

## Implemented vs planned

| Status | Area |
|---|---|
| ✅ | Auth (register, login, profile), Especies CRUD, Razas CRUD, Health, Swagger, CI |
| ⬜ | Animal endpoints (routes/controller/service not wired — model exists) |
| ⬜ | Usuario management endpoints (list, soft-delete users — planned in docs, no code yet) |
| ⬜ | Tests (none) |
| ⬜ | Seed script (referenced in `docs/plan.md`, does not exist) |

## Routes

All under `/api/v1/`.

## Commands

| Command | Description |
|---------|-------------|
| `npm run docker` | `docker compose up --build` |
| `npm run dev` | `nodemon server.js` |
| `npm start` | `node server.js` |

No lint, typecheck, or test scripts exist. CI only checks syntax (`node --check`) and that `app.js` loads without crashing: `node -e "require('./app.js')"`.

## CI (`.github/workflows/ci.yml`)

1. `npm ci`
2. `node --check app.js && node --check server.js`
3. `timeout 10 node -e "require('./app.js'); console.log('OK')"` with `NODE_ENV=test`, `MONGODB_URI`, `JWT_SECRET=test-secret`
4. MongoDB 7 service container available at `localhost:27017`

## Docker details

- **API container**: runs `npx nodemon server.js` with bind mount + `/app/node_modules` anonymous volume for hot reload in dev
- **MongoDB**: image `mongo:7`, healthcheck with `mongosh`, persistent volume `mongodb_data`
- **MONGODB_URI** inside Docker: overridden to `mongodb://root:rootpass@mongodb:27017/linajeanimal?authSource=admin`

## Swagger

Configured in `config/swagger.js` using `swagger-jsdoc`. Reads annotations from `./routes/*.js` and `./docs/swagger/*.yml`. Available at `GET /api/v1/docs`.

## Env vars

`PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `CORS_ORIGIN`, `API_URL` — validated at startup in `config/env.js`.

## OpenCode

- Agents: `@documentador`, `@reviewer`, `@security-auditor`, `@supervisor`, `@qa-verifier`, `@issuer`
- Skills: `rest-api-standards`, `security-checklist`
- Rubric: `parcial_api_rest_express_tema_libre.pdf`
