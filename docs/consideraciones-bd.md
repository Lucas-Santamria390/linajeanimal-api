# Consideraciones de Base de Datos — LinajeAnimal

> **Versión:** 1.3  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Julio 2026

---

## 1. Filosofía de diseño en MongoDB

A diferencia de SQL, donde primero se normaliza y luego se optimiza, en MongoDB el diseño del esquema debe basarse en las consultas más frecuentes de la aplicación.

**Preguntas guía antes de modelar:**
- ¿Qué datos se leen juntos?
- ¿Qué datos crecen mucho?
- ¿Qué datos cambian con frecuencia?
- ¿Qué datos se consultan de forma independiente?
- ¿Qué cálculos se repiten muchas veces?
- ¿Qué consultas deben ser rápidas?

---

## 2. Patrones de diseño usados actualmente

### 2.1 Parent References (árbol genealógico)

Para representar el árbol genealógico, usamos el patrón **Parent References**: cada documento `Animal` almacena las referencias (`ObjectId`) a su padre y madre.

```
Animal {
  _id: ObjectId,
  padre: ObjectId (ref: Animal),
  madre: ObjectId (ref: Animal),
  ...
}
```

**Por qué funciona:**
- Consultar los padres directos es inmediato (un solo `findById` o `populate`).
- Para construir el árbol completo se navega recursivamente hacia arriba.
- Mongoose resuelve las referencias con `.populate()`.

**Reglas de validación:**
- `padre` debe ser de sexo `macho`
- `madre` debe ser de sexo `hembra`
- Padre y madre deben pertenecer a la misma especie que el hijo
- Un animal no puede ser su propio padre o madre
- No se permiten ciclos genealógicos (validación en `isDescendantOf` en `animalService.js`)
- El padre y la madre no pueden ser el mismo animal

### 2.2 Extended References (Objetos Embebidos Parciales)

Para las relaciones más consultadas junto con `Animal`, se usa el patrón **Extended Reference**: en vez de un ObjectId simple, se almacena un objeto con los datos mínimos.

| Colección | Campo | Tipo | ¿Por qué Extended Reference? |
|---|---|---|---|
| `animales` | `especie` | Objeto `{ _id, nombre }` | Se consulta siempre con el animal |
| `animales` | `raza` | Objeto `{ _id, nombre }` | Se consulta siempre con el animal |
| `animales` | `propietario` | Objeto `{ _id, nombre, email }` | Se consulta siempre con el animal |
| `animales` | `padre`/`madre` | ObjectId (ref: Animal) | Parent References para árbol genealógico |

### 2.3 Computed Pattern

Se utiliza el patrón **Computed** para el campo `cantidadHijos` en `Animal`, que se actualiza mediante `$inc` cada vez que se asigna un padre o madre. Esto evita contar hijos en cada consulta.

### 2.4 Soft Delete

### 2.3 Soft Delete

Todas las entidades incluyen el campo `active: Boolean` con valor por defecto `true`. Ninguna operación elimina físicamente documentos.

```js
// Soft delete (nunca usar deleteOne/deleteMany/findByIdAndDelete)
findByIdAndUpdate(id, { active: false })
// Consultas siempre filtran por active: true
find({ active: true })
```

### 2.4 Timestamps automáticos

Todos los modelos usan `{ timestamps: true }` de Mongoose, que añade `createdAt` y `updatedAt` automáticamente.

---

## 3. Reglas para trabajar con la BD

### 3.1 Crear nuevos modelos

1. Definir el schema en `models/` con Mongoose.
2. Todos los modelos deben incluir `active: { type: Boolean, default: true }` para soft delete.
3. Todos los modelos deben incluir `{ timestamps: true }`.
4. Agregar los índices necesarios según los patrones de consulta.
5. NO usar `collection` personalizada — dejar que Mongoose pluralice el nombre.
6. NO exponer `password` en respuestas (`select: false` + `toJSON`).

### 3.2 Crear nuevas consultas

1. **Siempre filtrar por `active: true`** a menos que explícitamente se necesiten registros desactivados.
2. Usar `.populate()` para resolver referencias, pero evaluar si un **Extended Reference** sería más eficiente para consultas frecuentes.
3. Evitar `$lookup` (aggregation) siempre que sea posible — prefiere `populate` o datos embebidos.
4. Para consultas paginadas, usar `countDocuments` + `find` con `skip`/`limit`, no `cursor.count()`.

### 3.3 Actualizar documentos

1. Preferir `findByIdAndUpdate` con `{ new: true, runValidators: true }` sobre `save()`.
2. NO usar `findByIdAndDelete` o `remove()` — solo soft delete.
3. Para operaciones atómicas usar `$inc`, `$set`, `$push`, `$pull` según corresponda.

### 3.4 Índices

1. Crear índices compuestos para consultas con múltiples filtros (`{ campo1: 1, campo2: 1 }`).
2. Usar `{ unique: true }` o índices compuestos únicos para campos que deben ser únicos bajo ciertas condiciones (ej. `{ identificador: 1, 'propietario._id': 1 }` — único por propietario).
3. Revisar índices periódicamente con `mongosh`:

```javascript
db.animales.getIndexes()
db.animales.aggregate([{ $indexStats: {} }])
```

---

## 4. Patrones implementados (Fase 9 completada)

### 4.1 Extended Reference ✅

Se aplica en `Animal` para `especie`, `raza` y `propietario`. Cada campo almacena un objeto parcial con `_id` y `nombre` (y `email` para propietario), eliminando la necesidad de `.populate()` en estos campos.

**Sincronización:** Al actualizar el nombre de una Especie, Raza o Usuario, los servicios correspondientes propagan el cambio a los documentos `Animal` afectados para mantener consistencia eventual.

### 4.2 Computed Pattern ✅

Implementado en `Animal` con el campo `cantidadHijos`, que se actualiza mediante `$inc` al asignar o desasignar padres:

```js
// En animalService.create / assignParents:
if (payload.padre) {
  await Animal.findByIdAndUpdate(payload.padre, { $inc: { cantidadHijos: 1 } });
}
if (payload.madre) {
  await Animal.findByIdAndUpdate(payload.madre, { $inc: { cantidadHijos: 1 } });
}
```

### 4.3 Subset Pattern

Guardar solo un subconjunto de datos relacionados dentro del documento principal.

**Cuándo aplica:**
- Cuando los datos relacionados son muchos pero solo se necesita una muestra
- Ejemplo: primeras 5 lecciones de un curso, últimas 3 reseñas

### 4.4 Bucket Pattern

Agrupar registros pequeños en un solo documento por rango de tiempo.

**Cuándo aplica:**
- Datos de sensores, logs, eventos, mediciones continuas
- No aplica al dominio actual de genealogía animal

---

## 5. Guía rápida: Embedded vs Reference

| Situación | Recomendación |
|---|---|
| Los datos siempre se leen juntos | **Embebido** o Extended Reference |
| Los datos pueden crecer mucho | **Referencia** |
| Los datos pertenecen solo a ese documento | **Embebido** |
| Los datos se comparten entre varios documentos | **Referencia** |
| Los datos cambian constantemente | **Referencia** |
| La lista tiene tamaño pequeño o controlado | **Embebido** |
| Se necesita consistencia estricta | **Referencia** (evita duplicados) |
| El rendimiento de lectura es crítico | **Embebido** o Extended Reference |

---

## 6. Comandos útiles

```bash
# Conectarse a MongoDB via Docker
docker exec -it linajeanimal-mongodb-1 mongosh -u root -p rootpass

# Dentro de mongosh
use linajeanimal
db.animales.find().pretty()
db.animales.getIndexes()
db.animales.countDocuments({ active: true })
db.animales.aggregate([{ $indexStats: {} }])
```

---

## 7. Histórico de Cambios

| Versión | Fecha      | Descripción | Autor |
|---------|------------|-------------|-------|
| 1.0     | 2026-06-19 | Versión inicial | Doc Team |
| 1.2     | 2026-06-27 | Extended Reference y Computed Pattern marcados como implementados | S. Ábrego |
| 1.3     | 2026-07-01 | Índice de `identificador` cambiado de `unique sparse` a compuesto único `{ identificador, propietario._id }`. | Doc Team |
