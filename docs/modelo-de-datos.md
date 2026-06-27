# Modelo de Datos — LinajeAnimal

> **Versión:** 1.2  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

---

## 1. Estrategia General

### 1.1 Modelado de relaciones y Árbol Genealógico (Extended Reference)

Para cumplir con el **RNF-01** (tiempos de respuesta menores a 2 segundos en consultas de linaje) y evitar el uso excesivo de `.populate()` o lookups costosos en MongoDB, el sistema implementa la estrategia de **Extended Reference (Referencias Extendidas)**. 

En lugar de almacenar únicamente el `ObjectId` en la colección de Animales, se duplican de forma controlada los campos críticos de las colecciones relacionadas (`Especie`, `Raza`, `Usuario` y el parentesco auto-referenciado de `Padre/Madre`). La sincronización y consistencia eventual de estos datos embebidos se gestiona directamente desde la capa de **Services**.

### 1.2 Soft Delete

Todas las entidades incluyen el campo `active: Boolean` con valor por defecto `true`. Ninguna operación elimina físicamente documentos de la base de datos para preservar la integridad del árbol genealógico. Se usa `findByIdAndUpdate` con `{ active: false }` para desactivar de forma lógica.

### 1.3 Timestamps

Todos los modelos incluyen `createdAt` y `updatedAt` automáticos mediante la opción `timestamps: true` de Mongoose.

---

## 2. Colección: Usuarios

Almacena los usuarios del sistema con sus credenciales y roles.

| Campo | Tipo | Requerido | Único | Default | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto | Sí | Auto | Identificador único |
| `nombre` | String | Sí | No | — | Nombre completo del usuario |
| `email` | String | Sí | Sí | — | Correo electrónico (validado con regex) |
| `password` | String | Sí | No | — | Hash bcrypt de la contraseña (**mínimo 8 caracteres**) |
| `rol` | String | Sí | No | `'user'` | Enum: `'admin'` o `'user'` |
| `active` | Boolean | No | No | `true` | Soft delete (false = desactivado) |
| `createdAt` | Date | Auto | No | Auto | Fecha de creación |
| `updatedAt` | Date | Auto | No | Auto | Fecha de última actualización |

**Índices:**
- `{ email: 1 }` — único, para búsqueda por login.
- `{ rol: 1 }` — para filtrar rápidamente por privilegios de administración.

**Ejemplo del documento:**
```json
{
  "_id": "64a7c1e3f1d2c3a4b5e6f701",
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "$2a$10$...hash...",
  "rol": "user",
  "active": true,
  "createdAt": "2026-06-06T12:00:00.000Z",
  "updatedAt": "2026-06-06T12:00:00.000Z"
}

```

> **Nota de seguridad:** El campo `password` NUNCA se incluye en las respuestas de la API. Se usa `select: false` en el esquema de Mongoose para asegurar el aislamiento por defecto.

---

## 3. Colección: Especies

Representa las especies animales (taxonomía básica del sistema).

| Campo | Tipo | Requerido | Único | Default | Descripción |
| --- | --- | --- | --- | --- | --- |
| `_id` | ObjectId | Auto | Sí | Auto | Identificador único |
| `nombre` | String | Sí | Sí | — | Nombre de la especie (ej. "Porcino", "Canino") |
| `descripcion` | String | No | No | — | Descripción general de la especie |
| `active` | Boolean | No | No | `true` | Soft delete |
| `createdAt` | Date | Auto | No | Auto | Fecha de creación |
| `updatedAt` | Date | Auto | No | Auto | Fecha de última actualización |

**Índices:**

* `{ nombre: 1 }` — único, para búsquedas directas y prevenir duplicados exactos.

---

## 4. Colección: Razas

Representa las razas asociadas a una especie determinada.

| Campo | Tipo | Requerido | Único | Default | Descripción |
| --- | --- | --- | --- | --- | --- |
| `_id` | ObjectId | Auto | Sí | Auto | Identificador único |
| `nombre` | String | Sí | No* | — | Nombre de la raza (ej. "Duroc", "Landrace") |
| `descripcion` | String | No | No | — | Descripción y estándar zootécnico de la raza |
| `especie` | ObjectId | Sí | No | — | Referencia directa tradicional a la colección Especie |
| `active` | Boolean | No | No | `true` | Soft delete |
| `createdAt` | Date | Auto | No | Auto | Fecha de creación |
| `updatedAt` | Date | Auto | No | Auto | Fecha de última actualización |

**Índices:**

* `{ nombre: 1, especie: 1 }` — índice compuesto único (impide duplicar una raza bajo una misma especie).
* `{ especie: 1 }` — agiliza el filtrado dinámico de razas por su grupo taxonómico.

---

## 5. Colección: Animales (Entidad Principal con Extended Reference)

Corazón del dominio. Almacena la data del animal y embebe datos de contexto para optimizar consultas de árboles genealógicos en tiempo real sin operaciones encadenadas de lectura.

| Campo | Tipo | Requerido | Único | Default | Descripción |
| --- | --- | --- | --- | --- | --- |
| `_id` | ObjectId | Auto | Sí | Auto | Identificador único |
| `nombre` | String | Sí | No | — | Nombre de registro o alias del ejemplar |
| `sexo` | String | Sí | No | — | Enum: `'macho'` o `'hembra'` |
| `fechaNacimiento` | Date | Sí | No | — | Fecha de nacimiento para el cálculo de edad |
| `peso` | Number | No | No | — | Peso registrado en kg |
| `color` | String | No | No | — | Capa, pelaje o marcas particulares |
| `identificador` | String | No | Sí* | — | Microchip, arete o número de registro único (`sparse`) |
| `fotoUrl` | String | No | No | — | Enlace hacia el storage de imágenes del animal |
| `notas` | String | No | No | — | Historial o comentarios adicionales |
| `active` | Boolean | No | No | `true` | Soft delete |
| `propietario` | Object | Sí | No | — | **Extended Reference** de la cuenta asociada |
| `especie` | Object | Sí | No | — | **Extended Reference** de la especie zoológica |
| `raza` | Object | Sí | No | — | **Extended Reference** de la raza específica |
| `padre` | Object | No | No | `null` | **Extended Reference** del ancestro paterno directo |
| `madre` | Object | No | No | `null` | **Extended Reference** del ancestro materno directo |

### Estructura Detallada de los Objetos Embebidos (Extended Reference)

* **`propietario`**: `{ _id: ObjectId, nombre: String }`
* **`especie`**: `{ _id: ObjectId, nombre: String }`
* **`raza`**: `{ _id: ObjectId, nombre: String }`
* **`padre`**: `{ _id: ObjectId, nombre: String, identificador: String }` (Opcional)
* **`madre`**: `{ _id: ObjectId, nombre: String, identificador: String }` (Opcional)

**Índices:**

* `{ nombre: 1 }` — Búsquedas rápidas de ejemplares.
* `{ "especie._id": 1, "raza._id": 1 }` — Filtrado de inventario genético.
* `{ "padre._id": 1 }` y `{ "madre._id": 1 }` — Rastreo inmediato de descendencia (hijos/hermanos).
* `{ identificador: 1 }` — Único con propiedad `sparse` para ignorar los valores nulos.

**Ejemplo del documento optimizado:**

```json
{
  "_id": "64a7c1e3f1d2c3a4b5e6f705",
  "nombre": "Rex",
  "sexo": "macho",
  "fechaNacimiento": "2024-03-15T00:00:00.000Z",
  "peso": 32.5,
  "color": "Dorado",
  "identificador": "MICROCHIP-123456",
  "fotoUrl": "[https://ejemplo.com/fotos/rex.jpg](https://ejemplo.com/fotos/rex.jpg)",
  "notas": "Línea pura de alta ganancia",
  "active": true,
  "propietario": {
    "_id": "64a7c1e3f1d2c3a4b5e6f701",
    "nombre": "Juan Pérez"
  },
  "especie": {
    "_id": "64a7c1e3f1d2c3a4b5e6f702",
    "nombre": "Canino"
  },
  "raza": {
    "_id": "64a7c1e3f1d2c3a4b5e6f703",
    "nombre": "Labrador Retriever"
  },
  "padre": {
    "_id": "64a7c1e3f1d2c3a4b5e6f709",
    "nombre": "Thor",
    "identificador": "REG-998877"
  },
  "madre": {
    "_id": "64a7c1e3f1d2c3a4b5e6f710",
    "nombre": "Luna",
    "identificador": "REG-998855"
  },
  "createdAt": "2026-06-06T12:00:00.000Z",
  "updatedAt": "2026-06-27T14:30:00.000Z"
}

```

---

## 6. Diagrama Conceptual de Relaciones Extendidas

```
┌──────────────────┐           ┌─────────────────┐
│     Usuario      │           │     Especie     │
│──────────────────│           │─────────────────│
│ _id              │           │ _id             │
│ nombre  ─────────│           │ nombre ─────────│
│ email (único)    │           │ descripcion     │
└──────────────────│           └─────────────────│
                   │                             │
                   │ Copia de datos              │ Copia de datos
                   ▼                             ▼
       ┌─────────────────────────────────────────────────┐
       │                     Animal                      │
       │─────────────────────────────────────────────────│
       │ _id                                             │
       │ nombre                                          │
       │ sexo (macho/hembra)                             │
       │ identificador (único sparse)                    │
       │                                                 │
       │ propietario: { _id, nombre }                    │ <--- Ref. Extendida
       │ especie:     { _id, nombre }                    │ <--- Ref. Extendida
       │ raza:        { _id, nombre }                    │ <--- Ref. Extendida
       │                                                 │
       │ padre:       { _id, nombre, identificador } ────┼───┐
       │ madre:       { _id, nombre, identificador } ────┼─┐ │
       └─────────────────────────────────────────────────┘ │ │
         ▲                                                 │ │
         │ Auto-referencia por Extended Reference          │ │
         └─────────────────────────────────────────────────┴─┘

```

---

## 7. Validaciones de Dominio

### 7.1 Reglas de Parentesco Genealógico

| Regla | Implementación |
| --- | --- |
| Un animal listado como padre debe ser de sexo `macho`. | Verificación lógica en `animal.service.js` antes de la inserción o vinculación. |
| Un animal listado como madre debe ser de sexo `hembra`. | Verificación lógica en `animal.service.js` antes de la inserción o vinculación. |
| Un animal no puede ser su propio padre o madre. | Restricción estricta de cruce de IDs en los payloads entrantes. |
| No se permiten ciclos genealógicos directos (ej. A padre de B, y B padre de A). | Validación por profundidad en el servicio para mitigar recursión infinita. |
| El padre y la madre deben compartir de manera obligatoria la misma especie que el hijo. | Validación previa de consistencia taxonómica multiregistro. |

### 7.2 Reglas de Negocio y Control de Acceso

| Regla | Implementación |
| --- | --- |
| Solo administradores registran/modifican Especies y Razas. | Middleware de autorización basado en Roles (`checkRole(['admin'])`). |
| Los usuarios con rol `user` únicamente modifican los animales donde figuran como `propietario._id`. | Filtro condicional estricto inyectado en la lógica del Service de animales. |
| El formato de las contraseñas exige robustez estructural. | Validado mediante `express-validator` con un largo **mínimo de 8 caracteres**. |
| Prevención de errores de casteo en la base de datos. | Sanitización y comprobación de parámetros mediante `param('id').isMongoId()`. |

---

## 8. Consideraciones de Seguridad

* Los hooks de sincronización para cambios en documentos maestros (ej. si se edita el nombre de una Especie) se ejecutan en la capa de servicios para mantener actualizadas las referencias extendidas de forma atómica.
* El manejo centralizado de errores del backend intercepta cualquier fallo de duplicidad de índices (`MongoServerError: E11000`) convirtiéndolo en respuestas HTTP semánticas estructuradas.

---

## 9. Histórico de Cambios

| Versión | Fecha | Descripción | Autor |
| --- | --- | --- | --- |
| 1.0 | 2026-06-06 | Versión inicial estructurada. | Doc Team |
| 1.1 | 2026-06-06 | Integración de consideraciones de Docker Compose. | Doc Team |
| 1.2 | 2026-06-27 | **Refactorización completa a patrón Extended Reference**, aumento del tamaño mínimo de password a 8 caracteres y mapeo de rutas `/animals` en inglés. | Saùl Abrego |

```
