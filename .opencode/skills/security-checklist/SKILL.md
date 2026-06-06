---
name: security-checklist
description: >
  Checklist de seguridad para APIs Express con JWT y MongoDB.
  Cubre autenticación, autorización, cifrado, headers, rate limiting,
  validación de entrada y configuración segura.
compatibility: opencode
---

# Security Checklist for Express + JWT APIs

## Authentication (JWT)

- [ ] Middleware `auth.js` extrae token del header `Authorization: Bearer <token>`
- [ ] `jwt.verify(token, process.env.JWT_SECRET)` en cada ruta protegida
- [ ] `jwt.sign({ id, role }, secret, { expiresIn: '7d' })` en login
- [ ] Payload mínimo: solo `id` y `role` (no meter password, email innecesario)
- [ ] `expiresIn` siempre configurado
- [ ] Rutas públicas sin middleware de auth
- [ ] `GET /api/auth/profile` protegido con auth

## Authorization (roles)

- [ ] Middleware `role.js` recibe roles permitidos como parámetro
- [ ] Ejemplo: `authorize('admin')`, `authorize('admin', 'moderator')`
- [ ] Verifica `req.user.role` contra los roles permitidos
- [ ] Responde 403 si el rol no está autorizado
- [ ] Responde 401 si no hay token

## Password handling

- [ ] `bcrypt.hash(password, 10)` en registro
- [ ] `bcrypt.compare(password, user.password)` en login
- [ ] Salt rounds ≥ 10
- [ ] password NUNCA devuelto en respuestas (excluir con `.select('-password')` o `toJSON` transformer)
- [ ] Longitud mínima validada (≥ 6 caracteres)

## Security headers

- [ ] `app.use(helmet())` — protege contra vulnerabilidades web comunes
- [ ] CORS con orígenes específicos y no solo `*` en producción:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

- [ ] CORS antes que cualquier ruta

## Rate limiting

- [ ] Aplicar a rutas de autenticación:
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20, // 20 intentos por ventana
  message: { success: false, message: 'Demasiados intentos. Intenta de nuevo más tarde.' }
});
app.use('/api/auth', authLimiter);
```

## Input validation

- [ ] Validar campos requeridos: nombre, email, password, etc.
- [ ] Validar formato de email (regex simple o librería)
- [ ] Validar password min length (≥ 6)
- [ ] Validar valores enum: rol (`['admin', 'user']`), estado (`['activo', 'inactivo']`)
- [ ] Validar ObjectId antes de consultar:
```javascript
if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ success: false, message: 'ID inválido' });
}
```
- [ ] Verificar existencia del recurso antes de update/delete
- [ ] Sanitizar entrada para prevenir inyección NoSQL (usar `express-validator` o similar)

## Error handling

- [ ] `middleware/errorHandler.js` global (último middleware en app.js)
- [ ] NO mostrar stack trace en producción
- [ ] Errores de validación → 400
- [ ] Token ausente/inválido → 401
- [ ] Rol no autorizado → 403
- [ ] Recurso no encontrado → 404
- [ ] Error interno → 500 (mensaje genérico)

## Environment & config

- [ ] `.env` en `.gitignore`
- [ ] `.env.example` presente con todas las variables documentadas
- [ ] Variables mínimas: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`
- [ ] Validar variables al iniciar:
```javascript
const required = ['MONGODB_URI', 'JWT_SECRET'];
required.forEach(v => { if (!process.env[v]) throw new Error(`Falta ${v}`); });
```

## Soft deletes

- [ ] Campo `active: { type: Boolean, default: true }` en schemas
- [ ] Queries filtran `{ active: true }`
- [ ] DELETE hace `findByIdAndUpdate(id, { active: false })` no `findByIdAndDelete`

## Dependencies checklist

```json
{
  "dependencies": {
    "express": "*",
    "mongoose": "*",
    "jsonwebtoken": "*",
    "bcryptjs": "*",
    "helmet": "*",
    "cors": "*",
    "express-rate-limit": "*",
    "express-validator": "*",
    "dotenv": "*",
    "morgan": "*"
  }
}
```
