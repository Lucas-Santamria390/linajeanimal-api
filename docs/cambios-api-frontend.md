# Cambios en la API para actualizar el Frontend

## 1. Nuevo endpoint: Activar/Desactivar Especie

```
PATCH /api/v1/especies/:id
Auth: Bearer <token>
Rol: admin
Body: { "active": true | false }
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "nombre": "Bovino",
    "descripcion": "...",
    "active": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errores:**
- `400` si `active` no es booleano o ID inválido
- `401` sin token
- `403` si no es admin
- `404` especie no encontrada
- `409` si se intenta desactivar pero tiene animales activos asociados

---

## 2. Nuevo endpoint: Activar/Desactivar Raza

```
PATCH /api/v1/razas/:id
Auth: Bearer <token>
Rol: admin
Body: { "active": true | false }
```

**Respuesta exitosa (200):** igual que especies pero con datos de raza.

**Mismos errores que especies** (409 si tiene animales activos asociados).

---

## 3. GET /api/v1/especies ahora acepta ?active

```
GET /api/v1/especies
GET /api/v1/especies?active=true     (solo activas)
GET /api/v1/especies?active=false    (solo desactivadas)
```

Si no se pasa `?active`, por defecto devuelve solo `active: true`.

Útil para que un admin pueda ver especies desactivadas y luego reactivarlas via PATCH.

---

## 4. GET /api/v1/razas ahora acepta ?active

```
GET /api/v1/razas
GET /api/v1/razas?active=true        (solo activas)
GET /api/v1/razas?active=false       (solo desactivadas)
GET /api/v1/razas?especie=ID&active=false  (filtros combinados)
```

Mismo comportamiento que especies.

---

## 5. Resumen de cambios para el Frontend

| Recurso | Antes | Después |
|---|---|---|
| Especies list | Solo activas | Acepta `?active` filter |
| Especies reactivar | ❌ No existía | ✅ `PATCH /:id` con `{active}` |
| Razas list | `?active` no funcionaba | Ahora filtra correctamente |
| Razas reactivar | ❌ No existía | ✅ `PATCH /:id` con `{active}` |

---

## 6. Ejemplos de uso en Frontend

### Panel admin — lista de especies desactivadas
```js
fetch('/api/v1/especies?active=false', {
  headers: { Authorization: `Bearer ${token}` }
})
```

### Botón reactivar especie
```js
fetch(`/api/v1/especies/${id}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ active: true })
})
```

### Botón desactivar raza
```js
fetch(`/api/v1/razas/${id}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ active: false })
})
```
