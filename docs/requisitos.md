# Requisitos del Sistema — LinajeAnimal

> **Versión:** 1.0  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

---

## 1. Introducción

LinajeAnimal es una API REST diseñada para gestionar el linaje y árbol genealógico de animales.
Permite registrar animales, definir sus relaciones de parentesco (padre, madre, hijos),
consultar el linaje completo de un ejemplar y administrar especies y razas.

Está pensada para criadores, asociaciones de razas, clubes de pedigree y cualquier organización
que necesite mantener un registro estructurado de animales con trazabilidad genealógica.

---

## 2. Requisitos Funcionales

### 2.1 Gestión de Especies

| ID     | Descripción                                                                 | Prioridad |
|--------|-----------------------------------------------------------------------------|-----------|
| RF-01  | Crear una especie con nombre, descripción y estado (booleano `active: true/false`) | Alta      |
| RF-02  | Listar todas las especies (con filtro por activas)                          | Alta      |
| RF-03  | Obtener detalle de una especie por ID                                       | Alta      |
| RF-04  | Actualizar datos de una especie                                             | Alta      |
| RF-05  | Eliminación lógica (soft delete) de una especie (desactivar)                | Alta      |

### 2.2 Gestión de Razas

| ID     | Descripción                                                                 | Prioridad |
|--------|-----------------------------------------------------------------------------|-----------|
| RF-06  | Crear una raza asociada a una especie, con nombre, descripción y estándar   | Alta      |
| RF-07  | Listar razas (con filtro por especie y por estado activo)                   | Alta      |
| RF-08  | Obtener detalle de una raza por ID                                          | Alta      |
| RF-09  | Actualizar datos de una raza                                                | Alta      |
| RF-10  | Eliminación lógica (soft delete) de una raza                                | Alta      |

### 2.3 Gestión de Animales (Corazón del dominio)

| ID     | Descripción                                                                 | Prioridad |
|--------|-----------------------------------------------------------------------------|-----------|
| RF-11  | Registrar un nuevo animal con: nombre, especie, raza, sexo, fecha de nacimiento, peso, color, identificador único (microchip/tatuaje/número de registro), foto URL, notas | Alta      |
| RF-12  | Asignar padre y/o madre a un animal (relaciones de parentesco)              | Alta      |
| RF-13  | Listar animales con filtros por especie, raza, sexo, propietario, activos   | Alta      |
| RF-14  | Obtener detalle completo de un animal (incluyendo padres e hijos)           | Alta      |
| RF-15  | Actualizar datos de un animal                                               | Alta      |
| RF-16  | Eliminación lógica (soft delete) de un animal                               | Alta      |
| RF-17  | Consultar el árbol genealógico de un animal (ancestros hasta 3-5 generaciones) | Alta   |
| RF-18  | Consultar los hijos directos de un animal                                   | Alta      |
| RF-19  | Consultar hermanos de un animal (mismos padres)                             | Media     |

### 2.4 Gestión de Usuarios y Autenticación

| ID     | Descripción                                                                 | Prioridad |
|--------|-----------------------------------------------------------------------------|-----------|
| RF-20  | Registro de usuario con email, contraseña, nombre, rol (user/admin)         | Alta      |
| RF-21  | Inicio de sesión (login) que devuelve token JWT                             | Alta      |
| RF-22  | Obtener perfil del usuario autenticado                                      | Alta      |
| RF-23  | Los usuarios pueden administrar solo los animales que ellos registraron (user) | Alta   |
| RF-24  | Los administradores pueden gestionar cualquier animal, especie, raza y usuario | Alta   |
| RF-25  | Listar usuarios (solo admin)                                                | Media     |
| RF-26  | Desactivar/activar usuarios (solo admin)                                    | Media     |

### 2.5 Seguridad

| ID     | Descripción                                                                 | Prioridad |
|--------|-----------------------------------------------------------------------------|-----------|
| RF-27  | Rate limiting en rutas de autenticación (máx. 10 intentos por cada 15 minutos) | Alta      |
| RF-28  | Protección de headers con Helmet                                            | Alta      |
| RF-29  | CORS configurado (permitir orígenes específicos)                            | Alta      |
| RF-30  | Contraseñas hasheadas con bcrypt (salt ≥ 10)                                | Alta      |
| RF-31  | Validación de datos de entrada en todas las rutas                           | Alta      |

### 2.6 Utilidades

| ID     | Descripción                                                                 | Prioridad |
|--------|-----------------------------------------------------------------------------|-----------|
| RF-32  | Endpoint de health check (`GET /api/v1/health`)                              | Alta      |
| RF-33  | Seed data para desarrollo (usuarios, especies, razas, animales)             | Media (pendiente) |
| RF-34  | Documentación de la API con Swagger (ruta `/api/v1/docs`)                    | Alta      |
| RF-35  | Sanitizar entrada para prevenir inyección NoSQL usando express-validator o mongo-sanitize | Alta      |

---

## 3. Requisitos No Funcionales

| ID     | Descripción                                                                 | Categoría        |
|--------|-----------------------------------------------------------------------------|------------------|
| RNF-01 | La API debe responder en menos de 2 segundos para consultas de linaje (< 5 generaciones) | Rendimiento |
| RNF-02 | El código debe seguir la arquitectura MVC con capa `services/` separada     | Mantenibilidad   |
| RNF-03 | `server.js` solo debe contener `listen()`, `app.js` la configuración Express | Mantenibilidad   |
| RNF-04 | Formato de respuesta consistente: `{ success: boolean, data: ... }` o `{ success: false, message: "..." }` | Consistencia |
| RNF-05 | Todos los errores deben ser manejados por un middleware centralizado         | Mantenibilidad   |
| RNF-06 | No deben exponerse stack traces en producción (NODE_ENV=production)         | Seguridad        |
| RNF-07 | No deben existir eliminaciones físicas (solo soft delete con `active: false`) | Integridad     |
| RNF-08 | Las contraseñas nunca deben incluirse en las respuestas de la API            | Seguridad        |
| RNF-09 | Validar ObjectId antes de consultas a la BD, verificar existencia antes de update/delete | Robustez |
| RNF-10 | Variables de entorno validadas al iniciar la aplicación (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`) | Configuración |
| RNF-11 | El proyecto debe incluir `.env.example` y `.env` en `.gitignore`            | Seguridad        |
| RNF-12 | Las dependencias deben gestionarse con npm y reflejarse en `package.json`    | Portabilidad     |

---

## 4. Roles de Usuario

| Rol     | Permisos                                                                 |
|---------|--------------------------------------------------------------------------|
| **admin** | CRUD completo en todas las entidades (Especie, Raza, Animal, Usuario). Gestión de usuarios (listar, desactivar). |
| **user** | Registro y gestión de sus propios animales. Consulta de especies, razas y animales públicos. No puede modificar animales de otros usuarios. |

---

## 5. Restricciones Técnicas

### 5.1 Stack principal (obligatorio)

- **Stack:** Node.js + Express + MongoDB/Mongoose
- **Autenticación:** JWT (jsonwebtoken)
- **Encriptación:** bcryptjs con salt ≥ 10
- **Validación:** express-validator
- **Rate limiting:** express-rate-limit
- **Seguridad HTTP:** helmet
- **CORS:** cors
- **Logs:** morgan (dev)
- **Base de datos:** MongoDB (Mongoose ODM)
- **Gestor de paquetes:** npm
- **Entorno:** Node.js ≥ 18

### 5.2 Containerización con Docker (modo recomendado)

El proyecto puede ejecutarse de dos maneras. **Docker Compose es el modo recomendado**
porque no requiere instalar Node.js ni MongoDB en el host:

| Modo | Requisitos | Comando |
|------|-----------|---------|
| **Docker Compose** 🐳 | Docker + Docker Compose | `npm run docker` |
| **Local** (alternativa) | Node.js ≥ 18, MongoDB instalado localmente | `npm run dev` |

**Archivos Docker:**

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Imagen multi-stage para Node.js (`node:20-alpine`, usuario no-root, Tini) |
| `.dockerignore` | Excluye `node_modules`, `.env`, `docs/`, `*.md` del contexto de build |
| `docker-compose.yml` | Servicios `api` (Express) y `mongodb` (MongoDB 7) con healthcheck y volumen persistente |

**Ventajas del modo Docker:**
- Un solo comando para levantar toda la infraestructura
- No requiere instalar Node.js ni MongoDB en el host
- Entorno reproducible y aislado
- Fácil de limpiar: `docker compose down -v` borra todo
- Ideal para corrección del parcial

---

## 6. Glosario

| Término           | Definición                                                                 |
|-------------------|----------------------------------------------------------------------------|
| **Pedigrí**       | Documento/registro que certifica el linaje de un animal                    |
| **Linaje**        | Línea de ascendencia de un animal (padres, abuelos, bisabuelos, etc.)     |
| **Especie**       | Categoría taxonómica (ej. Canino, Felino, Equino)                          |
| **Raza**          | Variedad dentro de una especie con características comunes (ej. Labrador)  |
| **Semental/Sire** | Padre en el contexto de cría animal                                        |
| **Madre/Dam**     | Madre en el contexto de cría animal                                        |
| **Soft Delete**   | Eliminación lógica: desactivar un registro sin borrarlo físicamente        |
| **Camada**        | Conjunto de crías nacidas de un mismo parto                                |

---

## 7. Histórico de Cambios

| Versión | Fecha      | Descripción            | Autor  |
|---------|------------|------------------------|--------|
| 1.0     | 2026-06-06 | Versión inicial                          | Doc Team |
| 1.1     | 2026-06-06 | Añadida sección 5.2 (Docker opcional)    | Doc Team |
