# Plan de Cambios Requeridos — LinajeAnimal

> Fecha: 2026-06-25
> Propósito: Documentar todos los problemas de lógica, arquitectura, seguridad y calidad detectados en la revisión QA, junto con la justificación y solución propuesta para cada uno.

---

## Prioridades

| Prioridad | Significado |
|-----------|-------------|
| 🔴 **Crítica** | Bug o violación arquitectónica que puede causar datos inconsistentes o comportamiento incorrecto |
| 🟡 **Alta** | Mejora sustancial de calidad, seguridad o mantenibilidad |
| ⚪ **Baja** | Optimización o mejora menor, sin impacto en funcionalidad |

---

## 1. 🔴 Corrección de naming: `remove` → `deactivate` (soft delete no es borrado)

### Problema
Los servicios `especieService`, `razaService` y `animalService` exponen un método llamado `remove()` que **no elimina el documento de la base de datos**. Solo establece `active: false`. El nombre `remove` es incorrecto porque sugiere borrado físico.

Además, el verbo HTTP `DELETE` en las rutas es engañoso: semánticamente debería ser una desactivación, no una eliminación.

### ¿Por qué es importante?
- **Claridad semántica**: Un desarrollador que lea `service.remove(id)` esperará que el documento desaparezca. Al no ser así, genera confusión y bugs potenciales.
- **Consistencia**: `usuarioService` ya usa correctamente `deactivate()` y `setActive()`. Los demás servicios deberían seguir el mismo patrón.
- **Contrato REST**: `DELETE` implica eliminación del recurso. Si solo se desactiva, el verbo correcto sería `PATCH` con `{ active: false }`.

### Archivos afectados

| Archivo | Línea | Código actual | Código propuesto |
|---------|-------|---------------|------------------|
| `services/especieService.js` | 31 | `const remove = async (id)` | `const deactivate = async (id)` |
| `services/especieService.js` | 41 | `module.exports = { ..., remove }` | `module.exports = { ..., deactivate }` |
| `services/razaService.js` | 48 | `const remove = async (id)` | `const deactivate = async (id)` |
| `services/razaService.js` | 58 | `module.exports = { ..., remove }` | `module.exports = { ..., deactivate }` |
| `services/animalService.js` | 423 | `const remove = async (id, usuario)` | `const deactivate = async (id, usuario)` |
| `services/animalService.js` | 542 | `module.exports = { ..., remove }` | `module.exports = { ..., deactivate }` |
| `controllers/especieController.js` | — | `especieService.remove(id)` | `especieService.deactivate(id)` |
| `controllers/razaController.js` | — | `razaService.remove(id)` | `razaService.deactivate(id)` |
| `controllers/animalController.js` | — | `animalService.remove(id, usuario)` | `animalService.deactivate(id, usuario)` |

---

## 2. 🔴 Soft delete: verificar dependencias activas antes de desactivar

### Problema
Al desactivar una especie o raza (`active: false`), no se verifica si existen animales activos que dependan de ella. Esto deja animales con referencias a entidades desactivadas, causando errores 404 al consultarlos.

### ¿Por qué es importante?
- **Integridad referencial**: Un animal activo no puede quedar apuntando a una especie o raza desactivada.
- **Experiencia de usuario**: El cliente recibirá errores 404 inesperados al consultar animales que siguen activos.
- **Prevención de datos huérfanos**: Sin esta validación, los datos quedan inconsistentes.

### Solución
Antes de `findByIdAndUpdate(id, { active: false })`, verificar:

```js
const dependencias = await Animal.exists({ especie: id, active: true });
if (dependencias) {
  const err = new Error('No se puede desactivar la especie porque tiene animales activos asociados');
  err.statusCode = 409; // Conflict
  throw err;
}
```

### Archivos afectados

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `services/especieService.js` | 31-39 | Agregar verificación con `Animal.exists({ especie: id, active: true })` antes de desactivar |
| `services/razaService.js` | 48-56 | Agregar verificación con `Animal.exists({ raza: id, active: true })` antes de desactivar |

---

## 3. 🔴 Sanitizar payload en `update` de especie y raza

### Problema
`especieService.update` y `razaService.update` pasan `data` (que viene directamente de `req.body`) a `findByIdAndUpdate` sin filtrar campos. Aunque `runValidators: true` ayuda, cualquier campo extraño se persistirá.

### ¿Por qué es importante?
- **Seguridad**: Un atacante podría inyectar campos inesperados en el documento.
- **Consistencia**: `animalService.update` ya usa `normalizeUpdatePayload()` para filtrar solo campos permitidos.
- **Principio de mínimo privilegio**: Solo deben persistirse los campos que el endpoint está diseñado para modificar.

### Solución
```js
// especieService.js
const ALLOWED_FIELDS = ['nombre', 'descripcion'];
const payload = {};
for (const field of ALLOWED_FIELDS) {
  if (data[field] !== undefined) payload[field] = data[field];
}
return Especie.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
```

### Archivos afectados

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `services/especieService.js` | 28 | Filtrar `data` a solo `['nombre', 'descripcion']` |
| `services/razaService.js` | 45 | Filtrar `data` a solo `['nombre', 'descripcion', 'especie']` |

---

## 4. 🔴 Paginación y filtro en `usuarioService.list()`

### Problema
`usuarioService.list()` retorna **todos** los usuarios sin paginación y sin filtrar por `active`. No hay límite de resultados.

### ¿Por qué es importante?
- **Rendimiento**: Sin paginación, si hay miles de usuarios el payload será masivo y la respuesta lenta.
- **Seguridad**: Un admin obtiene usuarios inactivos que quizás no debería ver por defecto.
- **Consistencia**: `animalService.list()` ya implementa paginación correcta.

### Solución
```js
const list = async (query = {}) => {
  const filters = {};
  filters.active = query.active !== undefined ? query.active : true;

  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [total, usuarios] = await Promise.all([
    Usuario.countDocuments(filters),
    Usuario.find(filters).sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    data: usuarios,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
```

### Archivo afectado

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `services/usuarioService.js` | 3-5 | Agregar paginación y filtro `active` |

---

## 5. 🔴 `buildTreeNode`: optimizar de N+1 y Extended References (Fase 9)

### Problema
`buildTreeNode` hace **1 query por nodo** del árbol genealógico. Para un árbol binario completo de 5 generaciones, son ~62 queries. Escala exponencialmente.

Además, cada nodo ejecuta **6 `populate()`** (`especie`, `raza`, `propietario`, `padre`, `madre`), multiplicando aún más la carga.

### ¿Por qué es importante?
- **Rendimiento**: 62+ queries + 6 populates por solicitud es inaceptable para producción.
- **Tiempo de respuesta**: Cada query tiene latencia de red + MongoDB. Se acumula rápidamente.
- **Escalabilidad**: Con muchos animales concurrentes, la base de datos se satura.
- **RNF-01**: La API debe responder en menos de 2 segundos para consultas de linaje.

### Solución inmediata (parcial)
**Opción A:** Usar `$graphLookup` de MongoDB Aggregation Pipeline para resolver todo el árbol en **1 sola query**.

**Opción B:** Batch loading — recolectar todos los IDs de nodos visitados y luego hacer una sola query `Animal.find({ _id: { $in: ids } })`, construyendo el árbol en memoria.

### Solución definitiva (Fase 9 — Extended References)
La optimización real viene de aplicar **Extended References** (ver sección 19): embeber `{ _id, nombre }` de especie, raza y propietario directamente en el documento `Animal`. Esto elimina los `populate()` a esas colecciones, reduciendo de 6 a solo 2 populates por nodo (`padre`, `madre`).

### Archivo afectado

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `services/animalService.js` | 186-220 | Refactorizar para usar `$graphLookup` o batch loading |

---

## 6. 🔴 Extended References y optimización MongoDB (Fase 9 del plan)

### Problema
El modelo actual usa **referencias simples** (ObjectId) para especie, raza y propietario dentro de `Animal`. Cada consulta debe hacer `populate()` para obtener el nombre de estas entidades. Esto multiplica las queries en todas las operaciones de lectura.

Estado actual de populates en cada consulta:

| Consulta | Populates |
|----------|-----------|
| `GET /animales/:id` | 5 (especie, raza, propietario, padre, madre) |
| `GET /animales` (lista) | 5 por documento |
| `GET /arbol-genealogico/:id` | 6 por nodo |
| `GET /:id/hijos` | 5 por documento |

### ¿Por qué es importante?
- **Rendimiento en el árbol genealógico**: Con 5 generaciones, eliminar especie/raza/propietario de los populates reduce de 6 a 2 populates por nodo (~66% menos).
- **RNF-01**: La API debe responder en menos de 2 segundos.
- **Escalabilidad**: Menos joins = menos carga en MongoDB.
- **Consistencia**: Los nombres de especie/raza cambian raramente, por lo que el riesgo de datos desactualizados es bajo.

### Solución

#### 6.1 — Extended References en Animal
Embeber `{ _id, nombre }` de especie, raza y propietario dentro del documento `Animal`:

```js
// models/Animal.js
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
}
```

#### 6.2 — Campo computado `cantidadHijos`
```js
// models/Animal.js (nuevo campo)
cantidadHijos: { type: Number, default: 0 }

// En animalService.create — al asignar padre/madre
if (payload.padre) {
  await Animal.findByIdAndUpdate(payload.padre, { $inc: { cantidadHijos: 1 } });
}
if (payload.madre) {
  await Animal.findByIdAndUpdate(payload.madre, { $inc: { cantidadHijos: 1 } });
}
```

#### 6.3 — Hooks de sincronización (en services, NO en modelos)

> ⚠️ **Decisión arquitectónica**: Los hooks NO deben vivir en los modelos (`Especie.js`, `Raza.js`) porque violan SRP (el modelo define schema, no orquesta lógica cross-collection) y DIP (crean dependencias circulares entre modelos). En su lugar, la sincronización se maneja desde los servicios.

Cuando se actualice el nombre de una especie o raza, sincronizar los nombres embebidos en Animal desde el service:

```js
// services/especieService.js
const update = async (id, data) => {
  // ... validaciones existentes ...
  const especieActualizada = await Especie.findByIdAndUpdate(id, payload, { new: true, runValidators: true });

  // Sincronizar nombre embebido en todos los animales de esta especie
  if (payload.nombre) {
    try {
      await Animal.updateMany(
        { 'especie._id': id },
        { 'especie.nombre': payload.nombre }
      );
    } catch (syncError) {
      console.error(`Error sincronizando nombre de especie ${id} en Animal:`, syncError);
      // No interrumpir la respuesta, pero loguear para auditoría
    }
  }

  return especieActualizada;
};
```

**Manejo de errores:** El bloque `try/catch` evita que un fallo en la sincronización impida la actualización principal. El error se loguea para auditoría (ver sección 24).

**Script de resync:** Crear `scripts/resync-extended-refs.js` para reparar datos embebidos si los hooks fallan o para migrar datos existentes:

```js
// scripts/resync-extended-refs.js
// Itera todos los animales y actualiza especie/raza/propietario embebidos
// desde las colecciones origen
const Animal = require('../models/Animal');
const Especie = require('../models/Especie');
// ...
async function resync() {
  const especies = await Especie.find();
  for (const e of especies) {
    await Animal.updateMany(
      { 'especie._id': e._id },
      { 'especie.nombre': e.nombre }
    );
  }
}
```

#### 6.4 — Eliminar populates redundantes
Una vez implementados los Extended References, eliminar los `populate()` de especie, raza y propietario en `animalService.js`. Solo mantener los de `padre` y `madre`.

#### 6.5 — Campo computado `cantidadAnimales` en Especie y Raza
```js
// models/Especie.js
cantidadAnimales: { type: Number, default: 0 }

// models/Raza.js
cantidadAnimales: { type: Number, default: 0 }

// En especieService.deactivate — al desactivar, actualizar
// En animalService.create/update/deactivate — $inc en especie y raza según corresponda
```

#### 6.6 — Índices compuestos faltantes
Agregar índices basados en las queries más frecuentes:
- `{ especie: 1, raza: 1, active: 1 }` — filtro combinado
- `{ propietario: 1, active: 1 }` — animales por usuario activos
- `{ 'especie._id': 1, active: 1 }` — filtro por especie embebida

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `models/Animal.js` | Agregar Extended References (especie, raza, propietario embebidos), campo `cantidadHijos`, índices compuestos |
| `services/animalService.js` | Actualizar `create`, `update` para escribir referencia embebida; `$inc` cantidadHijos y cantidadAnimales; eliminar populates redundantes de especie/raza/propietario |
| `models/Especie.js` | Agregar campo `cantidadAnimales` |
| `models/Raza.js` | Agregar campo `cantidadAnimales` |
| `services/especieService.js` | Agregar sincronización de nombre embebido en `update` (NO hook en el modelo) |
| `services/razaService.js` | Agregar sincronización de nombre embebido en `update` (NO hook en el modelo) |
| `scripts/resync-extended-refs.js` | **Crear** — script de migración para backfill de datos existentes al nuevo formato |
| `seed.js` | Actualizar seed para usar el nuevo formato de Extended References |

### Efecto esperado

| Consulta | Antes (populates) | Después (populates) | Mejora |
|----------|--------------------|---------------------|--------|
| `GET /animales` | 5 por doc | 2 (padre, madre) | −60% |
| `GET /animales/:id` | 5 | 2 (padre, madre) | −60% |
| `GET /arbol-genealogico` | 6 por nodo | 2 (padre, madre) | −66% |
| `GET /hijos` | 5 por doc | 2 (padre, madre) | −60% |

---

## 7. 🔴 Extraer `validarCampos` a middleware compartido (DRY)

### Problema
El middleware `validarCampos` está copiado exactamente igual en **5 archivos** de rutas:
- `routes/authRoutes.js:9-16`
- `routes/animalesRoutes.js:10-17`
- `routes/especiesRoutes.js:9-16`
- `routes/razasRoutes.js:9-16`
- `routes/usuariosRoutes.js:9-16`

### ¿Por qué es importante?
- **Mantenibilidad**: Si se necesita cambiar el formato de error, hay que modificarlo en 5 lugares.
- **DRY (Don't Repeat Yourself)**: Código duplicado es código que puede desincronizarse.
- **Principio de responsabilidad única**: La definición del middleware debe estar en un solo lugar.

### Solución
Crear `middleware/validarCampos.js`:
```js
const { validationResult } = require('express-validator');

const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join('; ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

module.exports = validarCampos;
```

Luego importar en cada ruta: `const validarCampos = require('../middleware/validarCampos');`

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Crear `middleware/validarCampos.js` | Contener la única definición de `validarCampos` |
| `routes/authRoutes.js` | Eliminar definición local, importar del middleware |
| `routes/animalesRoutes.js` | Eliminar definición local, importar del middleware |
| `routes/especiesRoutes.js` | Eliminar definición local, importar del middleware |
| `routes/razasRoutes.js` | Eliminar definición local, importar del middleware |
| `routes/usuariosRoutes.js` | Eliminar definición local, importar del middleware |

---

## 8. 🟡 Duplicación POST/PATCH en asignación de padres

### Problema
`routes/animalesRoutes.js:126-142` define `POST /:id/padres` y `PATCH /:id/padres` apuntando ambos al mismo controller `assignParents`. Hacen exactamente lo mismo.

### ¿Por qué es importante?
- **Mantenimiento duplicado**: Cualquier cambio debe hacerse en ambas rutas.
- **Confusión REST**: POST debería crear, PATCH actualizar parcialmente. Tener ambos es redundante.

### Solución
Eliminar `PATCH /:id/padres` y conservar solo `POST /:id/padres` (o viceversa, según decisión del equipo).

### Archivo afectado

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `routes/animalesRoutes.js` | 135-142 | Eliminar bloque `router.patch('/:id/padres', ...)` |

---

## 9. 🟡 Estandarizar naming de rutas a inglés

### Problema
Las rutas de animales usan español mientras que auth usa inglés:
- `GET /:id/arbol-genealogico` (español)
- `GET /:id/hijos` (español)
- `GET /:id/hermanos` (español)
- `POST /:id/padres` (español)
- `POST /register` (inglés)
- `POST /login` (inglés)

### ¿Por qué es importante?
- **Consistencia**: Una API debe usar un solo idioma en sus endpoints.
- **Convención REST**: La práctica estándar es usar inglés para rutas de API.
- **Integración**: Clientes internacionales esperan inglés en las rutas.

### Solución
Renombrar rutas:

| Ruta actual | Ruta propuesta |
|-------------|----------------|
| `/:id/arbol-genealogico` | `/:id/family-tree` |
| `/:id/hijos` | `/:id/children` |
| `/:id/hermanos` | `/:id/siblings` |
| `/:id/padres` | `/:id/parents` |

### Archivo afectado

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `routes/animalesRoutes.js` | 105, 112, 119, 126 | Renombrar rutas a inglés |

---

## 10. 🟡 Test de soft delete verifica propiedad inexistente

### Problema
`tests/especies.test.js:147` y `tests/razas.test.js:160` verifican:
```js
expect(verificarRes.body.data).toHaveProperty('deleted', true);
```
Pero el campo real es `active: false`, no `deleted`. El test **siempre pasa** pero no verifica nada realmente.

### ¿Por qué es importante?
- **Falso positivo**: El test parece pasar pero no está probando la funcionalidad real.
- **Confianza en la suite**: Tests engañosos reducen la confianza en el conjunto de pruebas.

### Solución
Cambiar a:
```js
expect(verificarRes.body.data).toHaveProperty('active', false);
```

### Archivos afectados

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `tests/especies.test.js` | 147 | `'deleted'` → `'active'`, `true` → `false` |
| `tests/razas.test.js` | 160 | `'deleted'` → `'active'`, `true` → `false` |

---

## 11. 🟡 `usuarioService.getById` no verifica `active`

### Problema
`usuarioService.getById` no verifica `!usuario.active`, a diferencia de `especieService.getById`, `razaService.getById` y `animalService.getActiveAnimalOrThrow` que sí lo hacen.

### ¿Por qué es importante?
- **Consistencia**: Todos los servicios deben comportarse igual al obtener un recurso por ID.
- **Seguridad**: No debería poderse acceder a un usuario desactivado por ID.

### Solución
```js
if (!usuario || !usuario.active) {
  const err = new Error('Usuario no encontrado');
  err.statusCode = 404;
  throw err;
}
```

### Archivo afectado

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `services/usuarioService.js` | 9 | Agregar `|| !usuario.active` |

---

## 12. 🟡 Agregar tests para usuarios

### Problema
No existe `tests/usuarios.test.js`. Los endpoints de usuarios (`GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios`, `PUT /usuarios/:id`, `DELETE /usuarios/:id`, `PATCH /usuarios/:id`) no tienen cobertura de tests.

### ¿Por qué es importante?
- **Cobertura**: Sin tests, los cambios en usuarios pueden romper funcionalidad sin detectarse.
- **Regresión**: No hay seguridad de que los endpoints funcionen correctamente.

### Solución
Crear `tests/usuarios.test.js` siguiendo el patrón de `tests/animales.test.js` (con `supertest`, `db-helper`, setup-env).

### Archivo a crear

| Archivo | Descripción |
|---------|-------------|
| `tests/usuarios.test.js` | Tests para CRUD de usuarios, desactivación, reactivación |

---

## 13. 🟡 Rate limiting global

### Problema
Solo existe `authLimiter` (10 req/15min) aplicado en auth. El resto de endpoints no tienen protección contra abuso.

### ¿Por qué es importante?
- **Seguridad**: Un atacante puede hacer millones de requests a `/api/v1/animales` o `/api/v1/especies` sin restricción.
- **Disponibilidad**: Sin rate limiting, un pico de tráfico (legítimo o no) puede tumbar el servidor.

### Solución
Agregar un rate limiter general (ej. 100 req/min) en `middleware/rateLimiter.js` y aplicarlo globalmente en `app.js`.

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `middleware/rateLimiter.js` | Agregar `generalLimiter` de 100 req/min |
| `app.js` | Aplicar `generalLimiter` globalmente con `app.use()` |

---

## 14. 🟡 Endpoint para cambio de contraseña

### Problema
No hay un endpoint `PUT /auth/password` o similar. Un usuario no puede cambiar su contraseña sin pasar por el admin.

### ¿Por qué es importante?
- **UX**: El usuario debe poder cambiar su propia contraseña.
- **Seguridad**: La contraseña actual debe verificarse antes de permitir el cambio.
- **Funcionalidad completa**: Es un feature esperado en cualquier sistema con autenticación.

### Solución
Crear `PUT /auth/password` que reciba `{ currentPassword, newPassword }`, verifique la actual con bcrypt y actualice si coincide.

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `routes/authRoutes.js` | Agregar ruta `PUT /password` |
| `controllers/authController.js` | Agregar `changePassword` |
| `services/authService.js` | Agregar `changePassword` que verifique contraseña actual |

---

## 15. 🟡 Validación de fortaleza de contraseña

### Problema
La validación actual solo exige 6 caracteres mínimos:
```js
body('password').isLength({ min: 6 }).withMessage('...')
```

### ¿Por qué es importante?
- **Seguridad**: 6 caracteres sin requisitos de complejidad es trivial de crackear.
- **Mejores prácticas**: OWASP recomienda mínimo 8 caracteres con mayúscula, número y especial.

### Solución
```js
body('password')
  .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
  .matches(/[A-Z]/).withMessage('Debe contener una mayúscula')
  .matches(/[0-9]/).withMessage('Debe contener un número')
  .matches(/[^A-Za-z0-9]/).withMessage('Debe contener un carácter especial'),
```

### Archivo afectado

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `routes/authRoutes.js` | 22 | Reforzar validación de contraseña |
| `routes/usuariosRoutes.js` | 37 | Reforzar validación de contraseña |

---

## 16. 🟡 Tests unitarios para services

### Problema
Todos los tests son de integración (E2E via supertest). No hay tests unitarios para funciones críticas.

### ¿Por qué es importante?
- **Detección temprana**: Tests unitarios detectan bugs en lógica pura sin depender de la BD.
- **Velocidad**: Los tests unitarios son órdenes de magnitud más rápidos que los de integración.

### Funciones a testear
- `animalService.validateExistingParent`
- `animalService.isDescendantOf`
- `animalService.buildTreeNode`
- `authService.generateToken`
- `authService.verifyToken`

### Archivo a crear

| Archivo | Descripción |
|---------|-------------|
| `tests/services/animalService.unit.test.js` | Tests unitarios para lógica de animales |
| `tests/services/authService.unit.test.js` | Tests unitarios para autenticación |

---

## 17. ⚪ Optimizar `animalService.deactivate` (query redundante)

### Problema
Hace dos queries cuando una basta:
1. `Animal.findById(id)` para verificar existencia
2. `Animal.findByIdAndUpdate(id, { active: false })` para desactivar

### ¿Por qué es importante?
- **Rendimiento**: Una query menos por operación de desactivación.
- **Código más limpio**: Menos líneas, misma funcionalidad.

### Solución
```js
const deactivate = async (id, usuario) => {
  // assertCanManageAnimal aún requiere el animal...
  // Pero se puede optimizar verificando solo con findByIdAndUpdate
};
```

### Archivo afectado

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `services/animalService.js` | 423-436 | Optimizar a una sola query |

---

## 18. ⚪ Validación de fecha futura en el route

### Problema
La validación de "fecha no futura" solo está en el service (`assertValidDate`) pero no en express-validator del route.

### ¿Por qué es importante?
- **Defensa en profundidad**: Validar temprano (en el route) evita procesar requests inválidas.
- **Feedback temprano**: El cliente recibe error 400 antes de llegar al service.

### Solución
```js
body('fechaNacimiento')
  .isISO8601().withMessage('...').toDate()
  .custom((value) => {
    if (value > new Date()) throw new Error('La fecha no puede ser futura');
    return true;
  }),
```

### Archivo afectado

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `routes/animalesRoutes.js` | 31 | Agregar custom validator de fecha no futura |

---

## 19. ⚪ Inconsistencia en formato de errores entre servicios

### Problema
Cada servicio usa un formato diferente para crear errores:
- `animalService` usa `createError(message, statusCode)` (helper propio)
- `authService` usa `new Error()` + `err.statusCode = 401`
- `especieService` usa `new Error()` + `err.statusCode = 404`

### ¿Por qué es importante?
- **Consistencia**: Un helper centralizado evita errores y asegura mismo comportamiento.
- **Mantenibilidad**: Si se cambia el formato de error, se cambia en un solo lugar.

### Solución
Extraer `createError` a un archivo compartido (ej. `utils/createError.js`) y usarlo en todos los servicios.

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Crear `utils/createError.js` | Helper centralizado para crear errores con statusCode |
| `services/especieService.js` | Usar `createError` en lugar de `new Error()` |
| `services/razaService.js` | Usar `createError` en lugar de `new Error()` |
| `services/usuarioService.js` | Usar `createError` en lugar de `new Error()` |
| `services/authService.js` | Usar `createError` en lugar de `new Error()` |

---

## 20. 🔴 Prevenir NoSQL injection en query params de rutas GET

### Problema
Las rutas `GET /animales`, `GET /razas` y `GET /usuarios` aceptan query params (`?especie=...`, `?raza=...`, `?propietario=...`, `?active=...`) que se pasan directamente al service sin validar que sean MongoId válidos en el route. La validación solo existe dentro del service.

Un atacante puede inyectar operadores MongoDB (`$regex`, `$where`, `$gt`, `$ne`) en estos parámetros:

```bash
GET /api/v1/animales?especie[$regex]=.*&active[$ne]=true
```

### ¿Por qué es importante?
- **NoSQL injection**: Permite a un atacante manipular consultas MongoDB sin autenticación.
- **Exfiltración de datos**: Puede acceder a registros que no debería ver.
- **Defensa en profundidad**: La validación debe estar en el route (capa HTTP) además del service (capa de negocio).

### Solución
Agregar validación de `isMongoId()` en los query params de las rutas GET, o sanitizarlos con un middleware que filtre operadores `$`:

```js
// routes/animalesRoutes.js
const { query } = require('express-validator');

router.get('/',
  auth,
  query('especie').optional().isMongoId().withMessage('Especie inválida'),
  query('raza').optional().isMongoId().withMessage('Raza inválida'),
  query('propietario').optional().isMongoId().withMessage('Propietario inválido'),
  query('sexo').optional().isIn(['macho', 'hembra']).withMessage('Sexo inválido'),
  query('active').optional().isBoolean().withMessage('Active debe ser booleano'),
  validarCampos,
  controller.list
);
```

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `routes/animalesRoutes.js` | Agregar validación `query()` con `isMongoId()` para especie, raza, propietario |
| `routes/razasRoutes.js` | Agregar validación `query('especie').isMongoId()` (ya existe parcialmente, reforzar) |
| `routes/usuariosRoutes.js` | Agregar validación `query()` para active, page, limit |

---

## 21. 🔴 Invalidar tokens JWT tras cambio de contraseña

### Problema
Cuando un usuario cambia su contraseña (sección 14), los tokens JWT existentes siguen siendo válidos hasta su expiración (7 días). Si un atacante tiene un token robado y la víctima cambia su contraseña, el atacante conserva acceso.

### ¿Por qué es importante?
- **Seguridad de sesión**: Un cambio de contraseña debe invalidar todas las sesiones existentes.
- **Protección post-robos**: Limita la ventana de exposición de tokens comprometidos.
- **Mejores prácticas OWASP**: Cambio de credencial = invalidación de tokens.

### Solución
Agregar un campo `tokenVersion` en el modelo `Usuario` e incluirlo en el payload del JWT:

```js
// models/Usuario.js
tokenVersion: { type: Number, default: 0 },

// services/authService.js — al generar token
const token = jwt.sign(
  { id: usuario._id, rol: usuario.rol, tokenVersion: usuario.tokenVersion },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// services/authService.js — changePassword
usuario.tokenVersion += 1;
await usuario.save();

// middleware/auth.js — verificar tokenVersion
if (usuario.tokenVersion !== decoded.tokenVersion) {
  return res.status(401).json({ success: false, message: 'Token inválido (sesión expirada)' });
}
```

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `models/Usuario.js` | Agregar campo `tokenVersion: { type: Number, default: 0 }` |
| `services/authService.js` | Incluir `tokenVersion` en el payload del JWT; incrementar al cambiar contraseña |
| `middleware/auth.js` | Verificar que `decoded.tokenVersion === usuario.tokenVersion` |

---

## 22. 🟡 Mecanismo de logout / revocación de tokens

### Problema
No existe un endpoint de logout. Los tokens JWT no se pueden revocar una vez emitidos. Si un usuario cierra sesión en el cliente, el token sigue siendo válido hasta su expiración natural.

### ¿Por qué es importante?
- **Control de sesión**: El usuario debe poder cerrar sesión explícitamente.
- **Seguridad en dispositivos compartidos**: Un token no revocado puede usarse desde otro dispositivo.
- **Comportamiento esperado**: Cualquier sistema con auth tiene logout.

### Solución
Crear un endpoint `POST /auth/logout` que agregue el token a una blacklist en memoria o en Redis. Alternativa simplificada: incrementar `tokenVersion` (misma lógica que sección 21, pero llamada desde logout).

```js
// routes/authRoutes.js
router.post('/logout',
  auth,
  controller.logout
);

// services/authService.js
const logout = async (usuarioId) => {
  // Incrementar tokenVersion invalida todos los tokens existentes
  await Usuario.findByIdAndUpdate(usuarioId, { $inc: { tokenVersion: 1 } });
};
```

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `routes/authRoutes.js` | Agregar `POST /logout` |
| `controllers/authController.js` | Agregar método `logout` |
| `services/authService.js` | Agregar función `logout` que incremente `tokenVersion` |

---

## 23. 🟡 Proteger documentación Swagger en producción

### Problema
`GET /api/v1/docs` sirve Swagger UI sin autenticación en todos los entornos, incluyendo producción. Esto expone la superficie de ataque completa de la API (todos los endpoints, schemas, parámetros) a cualquier visitante.

### ¿Por qué es importante?
- **Reducción de superficie de ataque**: La documentación detalla exactamente cómo interactuar con la API.
- **Seguridad por oscuridad**: Aunque no es la única defensa, no facilitar información del sistema es una capa adicional.
- **Mejores prácticas**: Swagger docs deben protegerse en producción.

### Solución
Restringir la ruta de docs a `NODE_ENV !== 'production'` o agregar autenticación básica:

```js
// app.js
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `app.js` | Envolver montaje de Swagger en `if (process.env.NODE_ENV !== 'production')` |

---

## 24. 🟡 Sistema de logging de eventos de seguridad

### Problema
No hay registro de eventos de seguridad como intentos fallidos de login, cambios de contraseña, desactivaciones de cuentas, o actividades sospechosas. Es imposible detectar y responder a incidentes.

### ¿Por qué es importante?
- **Detección de intrusiones**: Sin logs, un ataque de fuerza bruta pasa desapercibido.
- **Auditoría forense**: Tras un incidente, no hay trazas para investigar.
- **Cumplimiento**: Sistemas con datos sensibles deben auditar accesos y cambios.

### Solución
Agregar un `securityLogger` simple que registre eventos a un archivo o a la consola con formato estructurado:

```js
// middleware/securityLogger.js
const securityLogger = (evento, detalles = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    evento,
    ...detalles,
  };
  console.log(`[SECURITY] ${JSON.stringify(entry)}`);
  // En producción: escribir a archivo o servicio externo
};

module.exports = securityLogger;
```

Eventos a registrar:
- `LOGIN_SUCCESS` — usuario, IP
- `LOGIN_FAILURE` — email intentado, IP, razón
- `PASSWORD_CHANGE` — usuario, IP
- `ACCOUNT_DEACTIVATE` — admin, usuario objetivo, IP
- `TOKEN_INVALIDATED` — usuario, IP (logout)
- `SUSPICIOUS_ACTIVITY` — endpoint, IP, patrón detectado

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| Crear `middleware/securityLogger.js` | Logger estructurado de eventos de seguridad |
| `services/authService.js` | Loguear LOGIN_SUCCESS, LOGIN_FAILURE, PASSWORD_CHANGE |
| `services/usuarioService.js` | Loguear ACCOUNT_DEACTIVATE |
| `middleware/auth.js` | Loguear TOKEN_INVALIDATED |

---

## 25. ⚪ Documentación desactualizada tras aplicar los cambios

### Problema
Varios documentos existentes en `docs/` y `README.md` quedarán desactualizados una vez aplicados los cambios del plan.

### Documentos afectados

| Documento | Cambio que lo invalida | Acción requerida |
|-----------|------------------------|------------------|
| `docs/swagger/animales.yml` | Rutas español → inglés (sección 9); especie/raza/propietario ahora son objetos embebidos (sección 6) | Actualizar rutas y schemas de request/response |
| `docs/swagger/auth.yml` | Nuevo endpoint `PUT /password` (sección 14); logout (sección 22); password requirements cambian (sección 15) | Agregar rutas, actualizar schema de register |
| `docs/swagger/usuarios.yml` | `GET /usuarios` ahora devuelve `{ data, pagination }` (sección 4) | Actualizar formato de respuesta |
| `README.md` | Tabla de endpoints de animales usa rutas en español (sección 9); falta endpoint `PUT /auth/password` (sección 14) y `POST /auth/logout` (sección 22) | Actualizar tablas |
| `docs/requisitos.md` | Password mínimo cambia de 6 a 8 (sección 15) | Actualizar sección 7.2 |
| `docs/modelo-de-datos.md` | Password mínimo en 7.2; especie/raza/propietario como ObjectId en sección 5 (sección 6) | Actualizar schemas y referencias |
| `docs/consideraciones-bd.md` | Sección 4.1 describe Extended Reference como "futuro sprint" (sección 6) | Actualizar a "implementado" |
| `docs/plan.md` | Fase 9 parcialmente implementada; hooks movidos a services (sección 6.3) | Reflejar cambios realizados |

---

## Resumen de archivos a modificar

| Archivo | Tipo de cambio |
|---------|----------------|
| `services/especieService.js` | Renombrar `remove` → `deactivate`, agregar dependencias check, sanitizar update |
| `services/razaService.js` | Renombrar `remove` → `deactivate`, agregar dependencias check, sanitizar update |
| `services/animalService.js` | Renombrar `remove` → `deactivate`, optimizar `buildTreeNode`, optimizar query, actualizar create/update para Extended References, eliminar populates redundantes, $inc cantidadHijos |
| `services/usuarioService.js` | Agregar paginación en `list`, verificar `active` en `getById` |
| `controllers/especieController.js` | Actualizar llamado a `remove` → `deactivate` |
| `controllers/razaController.js` | Actualizar llamado a `remove` → `deactivate` |
| `controllers/animalController.js` | Actualizar llamado a `remove` → `deactivate` |
| `routes/animalesRoutes.js` | Estandarizar rutas a inglés, eliminar duplicación POST/PATCH, validar query params GET contra NoSQL injection |
| `routes/authRoutes.js` | Reforzar validación de contraseña, agregar `POST /logout`, agregar `PUT /password` |
| `routes/usuariosRoutes.js` | Reforzar validación de contraseña, validar query params GET |
| `routes/razasRoutes.js` | Reforzar validación de query param `especie` |
| `middleware/validarCampos.js` | **Crear** — middleware compartido |
| `middleware/rateLimiter.js` | Agregar rate limiter global |
| `middleware/auth.js` | Agregar verificación de `tokenVersion` en cada request autenticado |
| `middleware/securityLogger.js` | **Crear** — logger estructurado de eventos de seguridad |
| `utils/createError.js` | **Crear** — helper de errores |
| `scripts/resync-extended-refs.js` | **Crear** — script de migración para backfill de Extended References |
| `tests/especies.test.js` | Corregir `deleted` → `active` |
| `tests/razas.test.js` | Corregir `deleted` → `active` |
| `tests/usuarios.test.js` | **Crear** — tests de CRUD de usuarios |
| `tests/services/animalService.unit.test.js` | **Crear** — tests unitarios |
| `tests/services/authService.unit.test.js` | **Crear** — tests unitarios |
| `app.js` | Aplicar rate limiter global; proteger Swagger docs en producción |
| `models/Animal.js` | Agregar Extended References (especie, raza, propietario embebidos), campo `cantidadHijos`, índices compuestos |
| `models/Usuario.js` | Agregar campo `tokenVersion` |
| `models/Especie.js` | Agregar campo `cantidadAnimales` (sin hooks — sincronización en services) |
| `models/Raza.js` | Agregar campo `cantidadAnimales` (sin hooks — sincronización en services) |
| `seed.js` | Actualizar seed para nuevo formato de Extended References |

---

## Impacto estimado

| Dimensión | Antes | Después del plan |
|-----------|-------|------------------|
| **Puntaje estimado** | ~77/100 | ~94/100 |
| **Problemas críticos** | 6 | 0 |
| **Tests** | Cobertura parcial | Cobertura completa (usuarios + unitarios) |
| **Seguridad (NoSQL injection)** | ❌ No protegido | ✅ Query params validados en routes |
| **Seguridad (tokens)** | Sin invalidación post-cambio | ✅ tokenVersion + verificación en auth middleware |
| **Seguridad (logout)** | ❌ No existe | ✅ POST /auth/logout con invalidación |
| **Seguridad (docs expuestas)** | ❌ Swagger público en producción | ✅ Restringido a NODE_ENV !== production |
| **Seguridad (auditoría)** | ❌ Sin logs de seguridad | ✅ SecurityLogger para eventos críticos |
| **Rendimiento (árbol)** | 62+ queries + 6 populates/nodo | 1 query + 0-2 populates/nodo |
| **Rendimiento (populates)** | 5 populates por documento | 2 populates (solo padre/madre) |
| **DRY (código duplicado)** | 5 copias de `validarCampos` | 1 copia centralizada |
| **Consistencia REST** | Rutas mixtas español/inglés | 100% inglés |
| **Arquitectura (principios)** | Hooks en modelos violan SRP/DIP | Sincronización en services respeta SOLID |
