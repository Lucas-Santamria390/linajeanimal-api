# DS-Parcial2 — LinajeAnimal (Express REST API)

**Project state: scaffold only** — no source code exists. Generate everything from scratch.

**Domain**: LinajeAnimal = animal genealogy tree API. Entities: Animal (with parent/child relationships), Especie, Raza. Two roles: admin, user.

## Project structure (enforced by rubric)

```
/
├── config/          # DB connection, env config
├── middleware/       # auth, role, error handler, validation
├── models/          # Mongoose schemas
├── routes/          # Express routers
├── controllers/     # thin — delegate to services/
├── services/        # business logic
├── server.js        # listen() only
├── app.js           # Express app setup
├── .env.example
├── README.md
└── postman_collection.json (or Swagger)
```

## Non-negotiable requirements

- **Auth routes**: `POST /api/auth/register` (public), `POST /api/auth/login` (public), `GET /api/auth/profile` (auth required)
- **Health check**: `GET /api/health` or similar
- **Role middleware**: test 3 cases — authenticated allowed, authenticated denied (wrong role, 403), unauthenticated rejected (401)
- **Soft deletes**: `active: Boolean` field, no `deleteOne`/`findByIdAndDelete`/`deleteMany` — use `findByIdAndUpdate` with `{ active: false }`
- **Centralized error handler**: single middleware catching all errors, no stack traces in production
- **Data validation**: required fields, email format, password ≥ 6 chars, valid enum values, valid ObjectId before DB query, existence check before update/delete, sanitize input to prevent NoSQL injection
- **Seed data**: initial users and entity records
- **Response format**: `{ success: true, data: {...} }` / `{ success: false, message: "..." }` consistently
- **Security**: `.env` in `.gitignore`, `.env.example` provided, bcrypt (salt ≥ 10), no password in responses, CORS, helmet, rate-limiting on auth routes

## Critical deductions

- `services/` layer missing or controllers fat → deducted
- `server.js` and `app.js` not separate → deducted
- Password hash in responses → deducted
- Physical deletes → deducted
- No rate limiting on auth routes → deducted
- No `.env.example` → deducted

## Required dependencies

express, mongoose, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, express-validator, dotenv, morgan, nodemon (dev)

## Environment variables

`PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV` — validate at startup.

## Commands

```bash
npm run docker  # docker compose up --build (recomendado)
npm run dev     # nodemon (alternativa local)
node server.js  # production start
```

## OpenCode config

- No root `opencode.json` — `.opencode/` is the config root
- Agents: `.opencode/agents/` (`@documentador`, `@reviewer`, `@security-auditor`, `@supervisor`)
- Skills: `.opencode/skills/` (`rest-api-standards`, `security-checklist`) — auto-load when task matches
- Full assignment rubric (100 pts): `parcial_api_rest_express_tema_libre.pdf`
