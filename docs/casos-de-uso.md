# Casos de Uso — LinajeAnimal

> **Versión:** 1.1  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Julio 2026

---

## Convenciones

- **Actor primario:** quien inicia la interacción
- **Precondición:** estado necesario antes de ejecutar el caso de uso
- **Postcondición:** estado resultante después de ejecutarlo
- **Rol admin:** acceso completo a todas las operaciones
- **Rol user:** acceso limitado a sus propios recursos

> ✅ **Estado de implementación:** Todos los casos de uso descritos en este documento están implementados y operativos. Ver tabla de endpoints al final.

---

## CU-01: Registrar un nuevo animal

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado (admin o user)                            |
| **Descripción** | El usuario registra un nuevo animal en el sistema con sus datos básicos y parentesco |
| **Precondición**| El usuario está autenticado. La especie y raza existen.        |
| **Postcondición**| Se crea un documento Animal en la BD con estado `active: true`. |
| **Flujo normal**| 1. El usuario envía `POST /api/v1/animales` con `identificador` (requerido), `especie`, `raza`, `sexo`, `fechaNacimiento`, y opcionalmente `nombre`, `peso`, `color`, `padre`, `madre`.<br>2. El sistema valida los datos (especie, raza existen, ObjectId válidos, sexo válido).<br>3. Si se especifican padre/madre, verifica que existan y sean del sexo correcto.<br>4. El sistema crea el animal y lo asocia al usuario autenticado como `propietario`.<br>5. Responde con `201 Created` y los datos del animal creado. |
| **Flujo alterno**| 2a. Datos inválidos → `400 Bad Request`. <br>3a. Padre/madre no existen → `404 Not Found`. <br>3b. Padre no es macho o madre no es hembra → `400 Bad Request`. |

---

## CU-02: Consultar árbol genealógico de un animal

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado (admin o propietario del animal)          |
| **Descripción** | El usuario obtiene el árbol genealógico (ancestros) de un animal específico |
| **Precondición**| El animal existe y está activo. El usuario es admin o propietario del animal. |
| **Postcondición**| Se devuelve una estructura jerárquica con los ancestros.       |
| **Flujo normal**| 1. El usuario envía `GET /api/v1/animales/:id/family-tree?generaciones=3`.<br>2. El sistema verifica que el animal existe y que el usuario tiene permisos.<br>3. El sistema construye recursivamente el árbol (padre → abuelos → bisabuelos).<br>4. Responde con `200 OK` y la estructura del árbol. |
| **Flujo alterno**| 2a. Animal no existe o está desactivado → `404 Not Found`.<br>2b. Usuario regular no propietario → `403 Forbidden`. |

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "generaciones": 3,
    "arbol": {
      "_id": "...",
      "identificador": "ABC-123",
      "nombre": "Rex",
      "sexo": "macho",
      "fechaNacimiento": "2022-03-15T00:00:00.000Z",
      "padre": {
        "_id": "...",
        "identificador": "DEF-456",
        "nombre": "Max",
        "sexo": "macho",
        "fechaNacimiento": "2018-06-01T00:00:00.000Z",
        "padre": null,
        "madre": null
      },
      "madre": {
        "_id": "...",
        "identificador": "GHI-789",
        "nombre": "Bella",
        "sexo": "hembra",
        "fechaNacimiento": "2019-02-10T00:00:00.000Z",
        "padre": null,
        "madre": null
      }
    }
  }
}
```

---

## CU-03: Listar animales con filtros

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Cualquier usuario autenticado                                 |
| **Descripción** | El usuario consulta la lista de animales aplicando filtros opcionales |
| **Precondición**| El usuario está autenticado.                                   |
| **Postcondición**| Se devuelve una lista paginada de animales, ordenada por `identificador`. |
| **Flujo normal**| 1. El usuario envía `GET /api/v1/animales?especie=...&raza=...&sexo=...&active=true&page=1&limit=10`.<br>2. El sistema aplica los filtros y devuelve resultados paginados ordenados por `identificador`.<br>   - Usuario regular: solo ve sus propios animales (filtro `propietario` se ignora).<br>   - Admin: puede usar `?propietario=ID` para filtrar por usuario específico.<br>3. Responde con `200 OK`. |
| **Flujo alterno**| 2a. Sin filtros → devuelve animales activos del usuario (o todos si es admin).<br>2b. `?active=false` → devuelve animales inactivos (requiere permisos). |


---

## CU-04: Asignar padres a un animal

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado (admin o propietario del animal)           |
| **Descripción** | El usuario asigna o actualiza el padre y/o madre de un animal  |
| **Precondición**| El animal existe y está activo. Los padres existen y son activos. |
| **Postcondición**| El animal queda vinculado a sus padres.                        |
| **Flujo normal**| 1. El usuario envía `POST /api/v1/animales/:id/parents` con `{ padre: "id1", madre: "id2" }`.<br>2. El sistema valida que los IDs existen y los sexos son correctos.<br>3. Verifica que no se asignen padres que sean descendientes del animal (evitar ciclos).<br>4. Actualiza el animal.<br>5. Responde con `200 OK`. |
| **Flujo alterno**| 1a. Usuario regular no propietario → `403 Forbidden`.<br>2a. Padre/madre inválido o sexo incorrecto → `400 Bad Request`.<br>3a. Se detecta un ciclo genealógico → `400 Bad Request`. |


---

## CU-05a: Registrar usuario

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario no autenticado (público)                              |
| **Descripción** | Una persona se registra en el sistema                         |
| **Precondición**| El email no está registrado previamente.                       |
| **Postcondición**| Se crea un nuevo usuario con rol `user` por defecto.           |
| **Flujo normal**| 1. El usuario envía `POST /api/v1/auth/register` con email, password, nombre.<br>2. El sistema valida formato email y password ≥ 8 caracteres con mayúscula, número y carácter especial.<br>3. Hashea password con bcrypt (salt 10).<br>4. Crea usuario con rol `user` por defecto.<br>5. Responde `201 Created` (sin password en la respuesta). |
| **Flujo alterno**| 2a. Email inválido o password < 8 caracteres → `400 Bad Request`.<br>4a. Email duplicado → `400 Bad Request`. |

---

## CU-05b: Iniciar sesión

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario no autenticado (público)                              |
| **Descripción** | Un usuario registrado inicia sesión en el sistema             |
| **Precondición**| El usuario existe y está activo.                               |
| **Postcondición**| Se devuelve un token JWT válido.                               |
| **Flujo normal**| 1. El usuario envía `POST /api/v1/auth/login` con email y password.<br>2. El sistema verifica credenciales (email existe, password coincide).<br>3. Genera token JWT con `{ id, rol, tokenVersion }` y expiry (7 días).<br>4. Responde `200 OK` con token y datos del usuario (sin password). |
| **Flujo alterno**| 2a. Credenciales inválidas → `401 Unauthorized`.<br>2b. Usuario desactivado → `401 Unauthorized`. |

---

## CU-06: Consultar perfil del usuario autenticado

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado                                           |
| **Descripción** | El usuario obtiene su perfil y los animales que ha registrado   |
| **Precondición**| El usuario está autenticado (token JWT válido).                |
| **Postcondición**| Se devuelve la información del perfil.                         |
| **Flujo normal**| 1. El usuario envía `GET /api/v1/auth/profile` con token en header `Authorization: Bearer <token>`.<br>2. El sistema decodifica el token, busca al usuario y devuelve sus datos.<br>3. Responde `200 OK`. |
| **Flujo alterno**| 1a. Token inválido/expirado → `401 Unauthorized`.              |

---

## CU-07: Actualizar datos de un animal

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado (admin o propietario del animal)           |
| **Descripción** | El usuario modifica los datos de un animal existente           |
| **Precondición**| El animal existe y el usuario tiene permisos sobre él.         |
| **Postcondición**| Los datos del animal se actualizan.                            |
| **Flujo normal**| 1. El usuario envía `PUT /api/v1/animales/:id` con los campos a actualizar.<br>2. El sistema valida los datos.<br>3. Verifica que el usuario es admin o el `propietario` del animal.<br>4. Actualiza el documento.<br>5. Responde `200 OK`. |
| **Flujo alterno**| 3a. Usuario no autorizado → `403 Forbidden`.<br>2a. Datos inválidos → `400 Bad Request`. |


---

## CU-08: Eliminación lógica de un animal (soft delete)

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado con rol admin                             |
| **Descripción** | El admin desactiva un animal sin borrarlo físicamente          |
| **Precondición**| El animal existe y está activo.                                |
| **Postcondición**| El animal queda con `active: false`.                           |
| **Flujo normal**| 1. El admin envía `DELETE /api/v1/animales/:id`.<br>2. El sistema verifica rol admin.<br>3. Usa `findByIdAndUpdate` con `{ active: false }` (NO elimina físicamente).<br>4. Responde `200 OK` con los datos actualizados. |
| **Flujo alterno**| 2a. Usuario no es admin → `403 Forbidden`.<br>2b. Animal no existe → `404 Not Found`. |


---

## CU-09: Gestión de especies y razas (solo admin)

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Administrador                                                 |
| **Descripción** | El admin crea, actualiza o desactiva especies y razas          |
| **Precondición**| El admin está autenticado con rol `admin`.                     |
| **Postcondición**| La especie/raza es creada, actualizada o desactivada.          |
| **Flujo normal**| 1. Admin envía la solicitud al endpoint correspondiente (`/api/v1/especies`, `/api/v1/razas`).<br>2. El sistema verifica el rol admin.<br>3. Ejecuta la operación.<br>4. Responde según corresponda. |
| **Flujo alterno**| 2a. Usuario no es admin → `403 Forbidden`.<br>2b. No autenticado → `401 Unauthorized`. |

---

## CU-10: Consultar hijos y hermanos de un animal

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Usuario autenticado (admin o propietario del animal)          |
| **Descripción** | El usuario consulta los hijos directos o los hermanos de un animal |
| **Precondición**| El animal existe y está activo. El usuario es admin o propietario del animal. |
| **Postcondición**| Se devuelve la lista de hijos/hermanos ordenada por `identificador`. |
| **Flujo normal**| 1. Usuario envía `GET /api/v1/animales/:id/children` o `GET /api/v1/animales/:id/siblings`.<br>2. El sistema verifica permisos y busca los resultados ordenados por `identificador`.<br>3. Responde `200 OK` con la lista. |
| **Flujo alterno**| 2a. Animal no existe → `404 Not Found`.<br>2b. Usuario regular no propietario → `403 Forbidden`. |


---

## CU-11: Listar y gestionar usuarios (solo admin)

| Campo           | Detalle                                                       |
|-----------------|---------------------------------------------------------------|
| **Actor**       | Administrador                                                 |
| **Descripción** | El admin lista todos los usuarios o desactiva una cuenta       |
| **Precondición**| El admin está autenticado.                                     |
| **Postcondición**| Usuarios listados o cuenta desactivada.                        |
| **Flujo normal**| 1. Admin envía `GET /api/v1/usuarios` para listar o `DELETE /api/v1/usuarios/:id` para desactivar.<br>2. Verifica rol admin.<br>3. Ejecuta la operación (soft delete en usuarios también).<br>4. Responde `200 OK`. |
| **Flujo alterno**| 2a. No autorizado → `403 Forbidden`.                           |


---

## Resumen de Endpoints

| Método   | Ruta                                  | Auth     | Rol    | Descripción                          | Estado |
|----------|---------------------------------------|----------|--------|--------------------------------------|--------|
| POST     | `/api/v1/auth/register`                    | No       | —      | Registro de usuario                    | ✅ |
| POST     | `/api/v1/auth/login`                       | No       | —      | Inicio de sesión                       | ✅ |
| GET      | `/api/v1/auth/profile`                     | Sí       | —      | Perfil del usuario autenticado         | ✅ |
| PUT      | `/api/v1/auth/password`                    | Sí       | —      | Cambiar contraseña                     | ✅ |
| POST     | `/api/v1/auth/logout`                      | Sí       | —      | Cerrar sesión (invalida token)         | ✅ |
| GET      | `/api/v1/health`                           | No       | —      | Health check                           | ✅ |
| POST     | `/api/v1/especies`                         | Sí       | admin  | Crear especie                          | ✅ |
| GET      | `/api/v1/especies`                         | No       | —      | Listar especies                        | ✅ |
| GET      | `/api/v1/especies/:id`                     | No       | —      | Detalle de especie                     | ✅ |
| PUT      | `/api/v1/especies/:id`                     | Sí       | admin  | Actualizar especie                     | ✅ |
| DELETE   | `/api/v1/especies/:id`                     | Sí       | admin  | Soft delete especie                    | ✅ |
| POST     | `/api/v1/razas`                            | Sí       | admin  | Crear raza                             | ✅ |
| GET      | `/api/v1/razas`                            | No       | —      | Listar razas (filtro `?especie=id`)   | ✅ |
| GET      | `/api/v1/razas/:id`                        | No       | —      | Detalle de raza                        | ✅ |
| PUT      | `/api/v1/razas/:id`                        | Sí       | admin  | Actualizar raza                        | ✅ |
| DELETE   | `/api/v1/razas/:id`                        | Sí       | admin  | Soft delete raza                       | ✅ |
| POST     | `/api/v1/animales`                         | Sí       | —      | Crear animal (identificador requerido) | ✅ |
| GET      | `/api/v1/animales`                         | Sí       | —      | Listar animales (filtro por propietario) | ✅ |
| GET      | `/api/v1/animales/:id`                     | Sí       | —      | Detalle de animal                      | ✅ |
| PUT      | `/api/v1/animales/:id`                     | Sí       | —      | Actualizar animal                      | ✅ |
| DELETE   | `/api/v1/animales/:id`                     | Sí       | admin  | Soft delete animal                     | ✅ |
| POST     | `/api/v1/animales/:id/parents`             | Sí       | —      | Asignar/desasignar padres              | ✅ |
| GET      | `/api/v1/animales/:id/family-tree`         | Sí       | —      | Árbol genealógico (incluye identificador) | ✅ |
| GET      | `/api/v1/animales/:id/children`            | Sí       | —      | Hijos directos                         | ✅ |
| GET      | `/api/v1/animales/:id/siblings`            | Sí       | —      | Hermanos                               | ✅ |
| GET      | `/api/v1/usuarios`                         | Sí       | admin  | Listar usuarios (paginado)             | ✅ |
| DELETE   | `/api/v1/usuarios/:id`                     | Sí       | admin  | Desactivar usuario (soft delete)       | ✅ |
