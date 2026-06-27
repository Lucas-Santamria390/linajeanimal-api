# Consideraciones de Base de Datos — LinajeAnimal

> **Versión:** 1.2  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

---

## 1. Filosofía de diseño en MongoDB

A diferencia de SQL, donde primero se normaliza y luego se optimiza, en MongoDB el diseño del esquema debe basarse en las consultas más frecuentes de la aplicación. 

**Preguntas guía aplicadas a LinajeAnimal:**
- ¿Qué datos se leen juntos? (El perfil del animal siempre se despliega con el nombre de su raza y especie).
- ¿Qué consultas deben ser rápidas? (La generación recursiva del árbol genealógico de hasta 5 generaciones para cumplir el **RNF-01**).

---

## 2. Patrones de diseño usados actualmente

### 2.1 Extended Reference (Patrón Principal de Optimización)

Para optimizar las lecturas masivas y la navegación del árbol genealógico sin sobrecargar la base de datos con operaciones `.populate()` o agregaciones (`$lookup`) costosas, se utiliza el patrón **Extended Reference (Referencias Extendidas)** en la colección de animales.

En lugar de almacenar solo el `ObjectId` para enlazar colecciones, se inyecta una copia parcial y estática de los datos requeridos en el documento actual:


```

Animal {
_id: ObjectId,
nombre: String,
propietario: { _id: ObjectId, nombre: String },
especie:     { _id: ObjectId, nombre: String },
raza:        { _id: ObjectId, nombre: String },
padre:       { _id: ObjectId, nombre: String, identificador: String },
madre:       { _id: ObjectId, nombre: String, identificador: String }
}

```

#### Mecanismo de Consistencia
Dado que los datos duplicados pueden quedar desactualizados si un administrador (`admin`) edita el nombre de una especie o raza, la sincronización se realiza de forma atómica en la capa de **`services/`** (y no mediante hooks de Mongoose en los modelos, manteniendo estos últimos puros). Al actualizarse una entidad maestra, el servicio emite una actualización controlada sobre los subdocumentos embebidos en la colección de animales.

### 2.2 Parent References (Árbol Genealógico)

Para la estructura lógica del árbol, combinamos las referencias extendidas con el patrón **Parent References**: cada animal conoce directamente a su línea ascendente inmediata (`padre` y `madre`).

**Reglas de validación aplicadas en Services:**
- `padre` debe ser de sexo `macho`.
- `madre` debe ser de sexo `hembra`.
- Padre y madre deben pertenecer a la misma especie que el hijo.
- Un animal no puede ser su propio padre o madre.
- No se permiten ciclos genealógicos (validación recursiva mediante `isDescendantOf` en `animal.service.js`).
- El padre y la madre no pueden ser el mismo ejemplar.

### 2.3 Relaciones de Colección

| Colección | Campo | Refiere a | Estrategia Utilizada |
|---|---|---|---|
| `razas` | `especie` | `especies` | Referencia simple (`ObjectId`) |
| `animals` | `especie` | `especies` | **Extended Reference** `{ _id, nombre }` |
| `animals` | `raza` | `razas` | **Extended Reference** `{ _id, nombre }` |
| `animals` | `padre`/`madre` | `animals` | **Extended Reference** `{ _id, nombre, identificador }` |
| `animals` | `propietario` | `usuarios` | **Extended Reference** `{ _id, nombre }` |

### 2.4 Soft Delete

Todas las entidades incluyen el campo `active: Boolean` con valor por defecto `true`. Ninguna operación elimina físicamente documentos para preservar la integridad histórica y la trazabilidad del linaje.

```js
// Soft delete (Prohibido usar deleteOne o findByIdAndDelete)
findByIdAndUpdate(id, { active: false })

// Las consultas operacionales siempre filtran por defecto:
find({ active: true })

```

### 2.5 Timestamps automáticos

Todos los modelos usan `{ timestamps: true }` de Mongoose, abstrayendo la mutación de los campos `createdAt` y `updatedAt`.

---

## 3. Reglas para trabajar con la BD

### 3.1 Crear nuevos modelos

1. Definir el schema en `models/` manteniendo la pureza del esquema (sin lógica de negocio o hooks pesados).
2. Incluir obligatoriamente `active: { type: Boolean, default: true }` para soft delete.
3. Incluir `{ timestamps: true }`.
4. Evaluar campos candidatos a duplicación controlada si se leen recurrentemente de forma conjunta.
5. NO exponer credenciales en respuestas (`select: false` en contraseñas).

### 3.2 Crear nuevas consultas

1. **Siempre filtrar por `active: true**` en servicios públicos.
2. Aprovechar los objetos embebidos de las referencias extendidas antes de recurrir a un `.populate()`.
3. Para consultas paginadas, estructurar las respuestas devolviendo la raíz de paginación `{ data: [...], pagination: { ... } }`.

### 3.3 Actualizar documentos

1. Realizar las operaciones de escritura y validaciones complejas de dominio en la capa de `services/`.
2. Preferir operaciones atómicas de MongoDB (`$set`, `$inc`, `$push`) mediante `findByIdAndUpdate`.

### 3.4 Índices

1. Crear índices compuestos para rutas que filtren por propiedades anidadas, por ejemplo: `{ "especie._id": 1, "raza._id": 1 }`.
2. Usar `{ unique: true, sparse: true }` para el campo `identificador` en animales (admite múltiples valores `null` pero restringe duplicados en registros reales).

---

## 4. Patrones a considerar en futuros sprints

### 4.1 Computed Pattern

Almacenar valores precalculados para evitar operaciones de agregación repetitivas.

**Cuándo aplicaría:**

* Mostrar de forma ágil la `cantidadHijos` en el perfil de un animal semental sin realizar un `.countDocuments()` en cada request.

### 4.2 Subset Pattern

Guardar solo un subconjunto limitado de datos relacionados dentro del documento principal.

**Cuándo aplicaría:**

* Almacenar únicamente los últimos 3 controles de peso dentro del documento del animal, moviendo el histórico completo a una colección independiente de mediciones.

---

## 5. Guía rápida: Embedded vs Reference

| Situación | Recomendación |
| --- | --- |
| Los datos siempre se leen juntos y su volumen es estático | **Embebido** o Extended Reference |
| Los datos tienen un crecimiento lineal o indefinido | **Referencia** |
| Los datos se comparten e indexan entre múltiples documentos | **Referencia** (con Extended Reference para nombres) |
| El rendimiento y velocidad de lectura es crítico (**RNF-01**) | **Extended Reference** |

---

## 6. Comandos útiles

```bash
# Conectarse a MongoDB vía Docker Compose
npm run docker
docker exec -it linajeanimal-mongodb-1 mongosh -u root -p rootpass

# Dentro de mongosh
use linajeanimal
db.animals.find().pretty()
db.animals.getIndexes()
db.animals.countDocuments({ active: true })

```

---

## 7. Histórico de Cambios

| Versión | Fecha | Descripción | Autor |
| --- | --- | --- | --- |
| 1.0 | 2026-06-19 | Versión inicial. | Doc Team |
| 1.1 | 2026-06-25 | Ajuste de comandos y nombres de contenedores. | Saùl Ábrego |
| 1.2 | 2026-06-27 | **Pasar Extended Reference de "futuro sprint" a implementado**, documentar sincronización en servicios y corregir nombre de la colección a `animals`. | Saùl Ábrego |
