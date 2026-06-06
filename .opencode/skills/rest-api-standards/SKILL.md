---
name: rest-api-standards
description: >
  Convenciones y estándares para diseñar APIs REST con Express.
  Nomenclatura de rutas, verbos HTTP, códigos de estado, formato de respuestas,
  paginación, versionado y buenas prácticas de diseño.
compatibility: opencode
---

# REST API Standards

## Naming conventions

- Rutas en `kebab-case`: `/api/v1/productos`, `/api/v1/reservas`, `/api/v1/usuarios/:id`
- Sin verbos en la URL: `/api/v1/crear-producto` → `/api/v1/productos` (POST)
- Sin guiones bajos en rutas
- Nombres de recursos en plural para colecciones
- Parámetros de ruta con `:` (`/api/v1/productos/:id`)

## HTTP verbs & status codes

| Operación | Método | Ruta | Status code éxito |
|-----------|--------|------|-------------------|
| Crear | POST | `/api/v1/recursos` | 201 Created |
| Listar | GET | `/api/v1/recursos` | 200 OK |
| Obtener | GET | `/api/v1/recursos/:id` | 200 OK |
| Actualizar | PUT/PATCH | `/api/v1/recursos/:id` | 200 OK |
| Eliminar (soft) | DELETE | `/api/v1/recursos/:id` | 200 OK (con `active: false`) |

Status codes comunes:
- `200` — Éxito (GET, PUT, PATCH, DELETE)
- `201` — Recurso creado (POST)
- `204` — Éxito sin contenido (rara vez usado, mejor 200 con mensaje)
- `400` — Bad request (validación falló)
- `401` — No autenticado
- `403` — No autorizado (rol incorrecto)
- `404` — Recurso no encontrado
- `409` — Conflicto (duplicado)
- `422` — Entidad no procesable (validación)
- `429` — Too many requests (rate limit)
- `500` — Error interno del servidor

## Response format

Consistente en todas las respuestas:

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Recurso creado exitosamente"
}
```

### Lista paginada
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Mensaje claro del error",
  "error": { /* detalles solo si aplica */ }
}
```

## Error handler centralizado

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

## API versioning (obligatorio en este proyecto)

- **Este proyecto usa obligatoriamente el prefijo `/api/v1/` en todas las rutas.**
- No se admite el uso directo de `/api/` sin versión.
- El `app.js` monta routers con `app.use('/api/v1/productos', productosRouter)`
- Ejemplo: `POST /api/v1/auth/register`, `GET /api/v1/animales`, `GET /api/v1/health`

## Pagination

- Query params: `?page=1&limit=10`
- Valores por defecto: `page=1`, `limit=10`
- Límite máximo configurable (ej. `limit` no mayor a 100)

## Auth routes convention

| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/api/v1/auth/register` | Público |
| POST | `/api/v1/auth/login` | Público |
| GET | `/api/v1/auth/profile` | Autenticado |
