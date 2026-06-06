# Modelo de Datos — LinajeAnimal

> **Versión:** 1.0  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

---

## 1. Estrategia General

### 1.1 Modelado de relaciones parentales

Para representar el árbol genealógico, usamos el patrón **Parent References** de MongoDB:
cada documento Animal almacena las referencias (`ObjectId`) a su padre y madre.
Este patrón es ideal porque:

- Permite consultar los padres directos de forma inmediata (una sola query).
- Para construir el árbol genealógico completo, se navega recursivamente.
- MongoDB puede resolver estas referencias con `.populate()`.
- Es el patrón más flexible y natural para árboles genealógicos.
- Alternativa considerada: "Child References" (array de hijos) — se descartó porque
  no escala bien cuando hay muchos hijos y dificulta la navegación ascendente.

### 1.2 Soft Delete

Todas las entidades incluyen el campo `active: Boolean` con valor por defecto `true`.
Ninguna operación elimina físicamente documentos. Se usa `findByIdAndUpdate` con
`{ active: false }` para desactivar.

### 1.3 Timestamps

Todos los modelos incluyen `createdAt` y `updatedAt` automáticos (opción `timestamps: true` de Mongoose).

---

## 2. Colección: Usuarios

Almacena los usuarios del sistema con sus credenciales y roles.

| Campo       | Tipo         | Requerido | Único | Default     | Descripción                                    |
|-------------|--------------|-----------|-------|-------------|------------------------------------------------|
| `_id`       | ObjectId     | Auto      | Sí    | Auto        | Identificador único                            |
| `nombre`    | String       | Sí        | No    | —           | Nombre completo del usuario                    |
| `email`     | String       | Sí        | Sí    | —           | Correo electrónico (validado con regex)        |
| `password`  | String       | Sí        | No    | —           | Hash bcrypt de la contraseña (salt ≥ 10)       |
| `rol`       | String       | Sí        | No    | `'user'`    | Enum: `'admin'` o `'user'`                     |
| `active`    | Boolean      | No        | No    | `true`      | Soft delete (false = desactivado)              |
| `createdAt` | Date         | Auto      | No    | Auto        | Fecha de creación                              |
| `updatedAt` | Date         | Auto      | No    | Auto        | Fecha de última actualización                  |

**Índices:**
- `{ email: 1 }` — único, para búsqueda por login
- `{ rol: 1 }` — para filtrar por rol

**Ejemplo del documento:**
```json
{
  "_id": "ObjectId('...')",
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "password": "$2a$10$...hash...",
  "rol": "user",
  "active": true,
  "createdAt": "2026-06-06T12:00:00.000Z",
  "updatedAt": "2026-06-06T12:00:00.000Z"
}
```

> **Nota de seguridad:** El campo `password` NUNCA se incluye en las respuestas de la API.
> Se usa `select: false` en el esquema de Mongoose para excluirlo por defecto.

---

## 3. Colección: Especies

Representa las especies animales (taxonomía básica).

| Campo         | Tipo         | Requerido | Único | Default     | Descripción                                   |
|---------------|--------------|-----------|-------|-------------|-----------------------------------------------|
| `_id`         | ObjectId     | Auto      | Sí    | Auto        | Identificador único                            |
| `nombre`      | String       | Sí        | Sí    | —           | Nombre de la especie (ej. "Canino", "Felino") |
| `descripcion` | String       | No        | No    | —           | Descripción general de la especie              |
| `active`      | Boolean      | No        | No    | `true`      | Soft delete                                   |
| `createdAt`   | Date         | Auto      | No    | Auto        | Fecha de creación                              |
| `updatedAt`   | Date         | Auto      | No    | Auto        | Fecha de última actualización                  |

**Índices:**
- `{ nombre: 1 }` — único, para búsqueda por nombre

**Ejemplo:**
```json
{
  "_id": "ObjectId('...')",
  "nombre": "Canino",
  "descripcion": "Perros domésticos y especies relacionadas",
  "active": true,
  "createdAt": "2026-06-06T12:00:00.000Z",
  "updatedAt": "2026-06-06T12:00:00.000Z"
}
```

---

## 4. Colección: Razas

Representa las razas dentro de una especie.

| Campo         | Tipo         | Requerido | Único | Default     | Descripción                                    |
|---------------|--------------|-----------|-------|-------------|------------------------------------------------|
| `_id`         | ObjectId     | Auto      | Sí    | Auto        | Identificador único                            |
| `nombre`      | String       | Sí        | No*   | —           | Nombre de la raza (ej. "Labrador Retriever")   |
| `descripcion` | String       | No        | No    | —           | Descripción y estándar de la raza              |
| `especie`     | ObjectId     | Sí        | No    | —           | Referencia a Especie (ref: 'Especie')          |
| `active`      | Boolean      | No        | No    | `true`      | Soft delete                                    |
| `createdAt`   | Date         | Auto      | No    | Auto        | Fecha de creación                              |
| `updatedAt`   | Date         | Auto      | No    | Auto        | Fecha de última actualización                  |

**Índices:**
- `{ nombre: 1, especie: 1 }` — compuesto único (una raza no se repite dentro de la misma especie)
- `{ especie: 1 }` — para filtrar razas por especie

**Ejemplo:**
```json
{
  "_id": "ObjectId('...')",
  "nombre": "Labrador Retriever",
  "descripcion": "Raza de perro originaria de Terranova, Canadá",
  "especie": "ObjectId('...')",
  "active": true,
  "createdAt": "2026-06-06T12:00:00.000Z",
  "updatedAt": "2026-06-06T12:00:00.000Z"
}
```

---

## 5. Colección: Animales (entidad principal)

Corazón del dominio. Representa un animal individual con toda su información
genealógica y de identificación.

| Campo            | Tipo         | Requerido | Único | Default       | Descripción                                           |
|------------------|--------------|-----------|-------|---------------|-------------------------------------------------------|
| `_id`            | ObjectId     | Auto      | Sí    | Auto          | Identificador único                                   |
| `nombre`         | String       | Sí        | No    | —             | Nombre del animal                                     |
| `especie`        | ObjectId     | Sí        | No    | —             | Ref. a Especie                                        |
| `raza`           | ObjectId     | Sí        | No    | —             | Ref. a Raza                                           |
| `sexo`           | String       | Sí        | No    | —             | Enum: `'macho'` o `'hembra'`                          |
| `fechaNacimiento`| Date         | Sí        | No    | —             | Fecha de nacimiento                                   |
| `peso`           | Number       | No        | No    | —             | Peso en kg                                            |
| `color`          | String       | No        | No    | —             | Color o marcas distintivas                            |
| `identificador`  | String       | No        | Sí*   | —             | Número de microchip, tatuaje o registro (unique sparse)|
| `fotoUrl`        | String       | No        | No    | —             | URL de la foto del animal                             |
| `notas`          | String       | No        | No    | —             | Observaciones adicionales                             |
| `padre`          | ObjectId     | No        | No    | `null`        | Ref. a Animal (padre) — debe ser macho                |
| `madre`          | ObjectId     | No        | No    | `null`        | Ref. a Animal (madre) — debe ser hembra               |
| `propietario`    | ObjectId     | Sí        | No    | —             | Ref. a Usuario que registró el animal                 |
| `active`         | Boolean      | No        | No    | `true`        | Soft delete                                           |
| `createdAt`      | Date         | Auto      | No    | Auto          | Fecha de creación                                     |
| `updatedAt`      | Date         | Auto      | No    | Auto          | Fecha de última actualización                         |

**Índices:**
- `{ nombre: 1 }` — para búsqueda por nombre
- `{ especie: 1, raza: 1 }` — para filtrar por especie y raza
- `{ sexo: 1 }` — para filtrar por sexo
- `{ padre: 1 }` — para buscar hijos de un padre
- `{ madre: 1 }` — para buscar hijos de una madre
- `{ propietario: 1 }` — para filtrar por propietario
- `{ identificador: 1 }` — único con sparse (permite múltiples nulls)
- `{ active: 1 }` — para filtrar solo activos

**Ejemplo del documento:**
```json
{
  "_id": "ObjectId('...')",
  "nombre": "Rex",
  "especie": "ObjectId('id-especie-canino')",
  "raza": "ObjectId('id-raza-labrador')",
  "sexo": "macho",
  "fechaNacimiento": "2022-03-15T00:00:00.000Z",
  "peso": 32.5,
  "color": "Dorado",
  "identificador": "MICROCHIP-123456",
  "fotoUrl": "https://ejemplo.com/fotos/rex.jpg",
  "notas": "Campeón regional de obediencia 2024",
  "padre": "ObjectId('id-padre')",
  "madre": "ObjectId('id-madre')",
  "propietario": "ObjectId('id-usuario')",
  "active": true,
  "createdAt": "2026-06-06T12:00:00.000Z",
  "updatedAt": "2026-06-06T12:00:00.000Z"
}
```

---

## 6. Diagrama de Relaciones

```
┌──────────────────┐          ┌──────────────────┐
│     Usuario      │          │     Especie      │
│──────────────────│          │──────────────────│
│ _id              │          │ _id              │
│ nombre           │          │ nombre           │
│ email (único)    │          │ descripcion      │
│ password (hash)  │          │ active           │
│ rol (admin/user) │          └────────┬─────────┘
│ active           │                   │
└────────┬─────────┘                   │ 1
         │                            │
         │ 1               ┌──────────┴──────────┐
         │                 │        Raza          │
         │                 │──────────────────────│
         │                 │ _id                  │
         │                 │ nombre               │
         │                 │ descripcion          │
         │                 │ especie ─────────────┘
│                 │ active
│                 └──────────┬───────────┘
         │                            │ N
         │ *                          │
         │      ┌─────────────────────┴──────────────┐
         │      │             Animal                  │
         │      │────────────────────────────────────│
         └──────┤ propietario                        │
                │ nombre                             │
                │ especie ──────────────────────────►│ Especie
                │ raza ─────────────────────────────►│ Raza
                │ sexo (macho/hembra)                 │
                │ fechaNacimiento                     │
                │ peso, color                         │
                │ identificador (único sparse)        │
                │ fotoUrl, notas                      │
                │ padre ────────────────────────────┐ │
                │ madre ──────────────────────────┐ │ │
                │ active                          │ │ │
                └─────────────────────────────────┘ │ │
                  ▲                                 │ │
                  │                                 │ │
                  └─────────────────────────────────┘ │
                                                    │
                  └──────────────────────────────────┘
```

### Relaciones clave:

1. **Animal → Especie:** Muchos a uno (N:1). Cada animal pertenece a una especie.
2. **Animal → Raza:** Muchos a uno (N:1). Cada animal pertenece a una raza.
3. **Raza → Especie:** Muchos a uno (N:1). Una especie tiene muchas razas.
4. **Animal → Animal (padre):** Auto-referencia N:1. Un animal tiene un padre (macho).
5. **Animal → Animal (madre):** Auto-referencia N:1. Un animal tiene una madre (hembra).
6. **Animal → Usuario (propietario):** Muchos a uno (N:1). Un usuario puede registrar muchos animales.

---

## 7. Validaciones de Dominio

### 7.1 Reglas de parentesco

| Regla                                                                  | Implementación                                      |
|------------------------------------------------------------------------|-----------------------------------------------------|
| Un animal padre debe ser de sexo `macho`                               | Validación en service/controller antes de guardar   |
| Un animal madre debe ser de sexo `hembra`                              | Validación en service/controller antes de guardar   |
| Un animal no puede ser su propio padre o madre                         | Validación de ID repetido                           |
| No se permiten ciclos genealógicos (A padre de B, B padre de A)        | Validación recursiva o por profundidad máxima        |
| Padre y madre deben ser de la misma especie que el hijo                | Validación de especie consistente                    |

### 7.2 Reglas de negocio

| Regla                                                                  | Implementación                                      |
|------------------------------------------------------------------------|-----------------------------------------------------|
| Solo los administradores pueden crear/especies/razas                    | Role middleware                                     |
| Un usuario `user` solo puede modificar animales donde sea `propietario`| Verificación en service                             |
| El email debe tener formato válido                                     | express-validator + regex                           |
| Password mínimo 6 caracteres                                           | express-validator                                   |
| ObjectId debe ser válido antes de consultar la BD                      | Validación custom middleware                        |

---

## 8. Consideraciones de Seguridad

- `password` en Usuario usa `select: false` — nunca se devuelve en queries
- Los campos `active` se verifican en todas las consultas (solo registros activos)
- Los roles se validan con middleware específico
- Las referencias a otras colecciones se validan (deben existir y estar activas)

---

## 9. Histórico de Cambios

| Versión | Fecha      | Descripción            | Autor  |
|---------|------------|------------------------|--------|
| 1.0     | 2026-06-06 | Versión inicial        | Doc Team |
