# Issues — LinajeAnimal

> Mapa de issues vs secciones de `docs/cambios-requeridos.md`

---

## Big Issue 1: Renombrar `remove` → `deactivate`

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 1 | Renombrar método `remove` → `deactivate` en servicios y controladores | §1 | `services/especieService.js`, `services/razaService.js`, `services/animalService.js`, `controllers/especieController.js`, `controllers/razaController.js`, `controllers/animalController.js` |

---

## Big Issue 2: Verificar dependencias activas antes de desactivar

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 2 | Agregar `Animal.exists()` antes de desactivar especie/raza | §2 | `services/especieService.js`, `services/razaService.js` |

---

## Big Issue 3: Sanitizar payload en updates

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 3 | Filtrar campos permitidos con `ALLOWED_FIELDS` en update | §3 | `services/especieService.js`, `services/razaService.js` |

---

## Big Issue 4: Completar `usuarioService`

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 4 | Agregar paginación y filtro `active` en `list()` + verificar `active` en `getById()` | §4, §11 | `services/usuarioService.js` |

---

## Big Issue 5: Extended References + optimización MongoDB

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 5.1 | Embeber `{ _id, nombre }` de especie, raza y propietario en `Animal` | §6.1 | `models/Animal.js`, `seed.js` |
| 5.2 | Agregar campo `cantidadHijos` en Animal con `$inc` | §6.2 | `models/Animal.js`, `services/animalService.js` |
| 5.3 | Agregar campo `cantidadAnimales` en Especie y Raza | §6.5 | `models/Especie.js`, `models/Raza.js` |
| 5.4 | Sincronizar nombre embebido desde especieService y razaService (NO hooks en modelos) | §6.3 | `services/especieService.js`, `services/razaService.js` |
| 5.5 | Crear script de migración `scripts/resync-extended-refs.js` + eliminar populates redundantes | §6.3, §6.4 | `scripts/resync-extended-refs.js`, `services/animalService.js` |

---

## Big Issue 6: Código duplicado (DRY)

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 6 | Extraer `validarCampos` a middleware + eliminar POST/PATCH duplicado | §7, §8 | Crear `middleware/validarCampos.js`, modificar 5 routes + `routes/animalesRoutes.js` |

---

## Big Issue 7: Estandarizar rutas a inglés

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 7 | Renombrar rutas de español a inglés | §9 | `routes/animalesRoutes.js` |

---

## Big Issue 8: Tests

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 8.1 | Corregir falsos positivos (`deleted` → `active`) | §10 | `tests/especies.test.js`, `tests/razas.test.js` |
| 8.2 | Crear tests de usuarios + tests unitarios para services | §12, §16 | `tests/usuarios.test.js`, `tests/services/animalService.unit.test.js`, `tests/services/authService.unit.test.js` |

---

## Big Issue 9: Seguridad (infraestructura)

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 9.1 | Validar query params en rutas GET contra NoSQL injection | §20 | `routes/animalesRoutes.js`, `routes/razasRoutes.js`, `routes/usuariosRoutes.js` |
| 9.2 | Rate limiting global + proteger Swagger en producción | §13, §23 | `middleware/rateLimiter.js`, `app.js` |
| 9.3 | Crear `middleware/securityLogger.js` para eventos críticos | §24 | Crear `middleware/securityLogger.js`, modificar services/authService.js, services/usuarioService.js, middleware/auth.js |

---

## Big Issue 10: Autenticación

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 10.1 | Endpoint cambio de contraseña + fortaleza de password + logout + tokenVersion | §14, §15, §21, §22 | `routes/authRoutes.js`, `controllers/authController.js`, `services/authService.js`, `middleware/auth.js`, `models/Usuario.js`, `routes/usuariosRoutes.js` |

---

## Big Issue 11: Calidad de código

| # | Sub-Issue | Sección en cambios-requeridos.md | Archivos afectados |
|---|-----------|----------------------------------|---------------------|
| 11.1 | Centralizar errores en `utils/createError.js` + unificar servicios | §19 | Crear `utils/createError.js`, modificar `services/especieService.js`, `services/razaService.js`, `services/usuarioService.js`, `services/authService.js` |
| 11.2 | Optimizar query redundante en deactivate + validación fecha futura en route | §17, §18 | `services/animalService.js`, `routes/animalesRoutes.js` |
| 11.3 | Actualizar documentación (swagger, readme, docs) post-cambios | §25 | `docs/swagger/animales.yml`, `docs/swagger/auth.yml`, `docs/swagger/usuarios.yml`, `README.md`, `docs/requisitos.md`, `docs/modelo-de-datos.md`, `docs/consideraciones-bd.md`, `docs/plan.md` |

---

## Resumen

| Big Issue | Sub-Issues |
|-----------|-----------|
| 1 — Renombrar `remove` → `deactivate` | 1 |
| 2 — Dependencias en desactivación | 1 |
| 3 — Sanitizar payload | 1 |
| 4 — Completar usuarioService | 1 |
| 5 — Extended References | 5 |
| 6 — DRY | 1 |
| 7 — Rutas a inglés | 1 |
| 8 — Tests | 2 |
| 9 — Seguridad infraestructura | 3 |
| 10 — Autenticación | 1 |
| 11 — Calidad de código | 3 |
| **Total** | **20** |
