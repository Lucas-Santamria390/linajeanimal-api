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

- Rutas en `kebab-case`: `/api/productos`, `/api/reservas`, `/api/usuarios/:id`
- Sin verbos en la URL: `/api/crear-producto` → `/api/productos` (POST)
- Sin guiones bajos en rutas
- Nombres de recursos en plural para colecciones
- Parámetros de ruta con `:` (`/api/productos/:id`)

## HTTP verbs & status codes

| Operación | Método | Ruta | Status code éxito |
|-----------|--------|------|-------------------|
| Crear | POST | `/api/recursos` | 201 Created |
| Listar | GET | `/api/recursos` | 200 OK |
| Obtener | GET | `/api/recursos/:id` | 200 OK |
| Actualizar | PUT/PATCH | `/api/recursos/:id` | 200 OK |
| Eliminar (soft) | DELETE | `/api/recursos/:id` | 200 OK (con `active: false`) |

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

## API versioning (opcional)

- Para proyectos pequeños o académicos, se puede omitir el versionado (usar `/api/` directamente)
- Si se versiona, usar prefijo `/api/v1/` en todas las rutas (ej. `/api/v1/productos`)
- El `app.js` monta routers con `app.use('/api/v1/productos', productosRouter)`

## Pagination

- Query params: `?page=1&limit=10`
- Valores por defecto: `page=1`, `limit=10`
- Límite máximo configurable (ej. `limit` no mayor a 100)

## Auth routes convention

| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/profile` | Autenticado |
