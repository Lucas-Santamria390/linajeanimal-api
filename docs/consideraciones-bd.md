# Consideraciones de Base de Datos — LinajeAnimal

> **Versión:** 1.0  
> **Proyecto:** LinajeAnimal — API REST para gestión de árbol genealógico de animales  
> **Fecha:** Junio 2026

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

### 2.2 Referencias simples (ObjectId)

Todas las relaciones entre colecciones usan ObjectId como referencia:

| Colección | Campo | Refiere a | ¿Por qué referencia? |
|---|---|---|---|
| `razas` | `especie` | `especies` | Una especie tiene muchas razas |
| `animales` | `especie` | `especies` | Muchos animales comparten la misma especie |
| `animales` | `raza` | `razas` | Muchos animales comparten la misma raza |
| `animales` | `padre`/`madre` | `animales` | Estructura de árbol (Parent References) |
| `animales` | `propietario` | `usuarios` | Un usuario puede tener muchos animales |

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
2. Usar `{ unique: true, sparse: true }` para campos opcionales pero únicos (ej. `identificador`).
3. Revisar índices periódicamente con `mongosh`:

```javascript
db.animales.getIndexes()
db.animales.aggregate([{ $indexStats: {} }])
```

---

## 4. Patrones a considerar en futuros sprints

### 4.1 Extended Reference

Copiar campos de uso frecuente de un documento referenciado directamente en el documento actual para evitar `populate` innecesarios.

**Cuándo aplica:**
- Cuando un campo de otra colección se consulta siempre junto con el documento actual
- Ejemplo: guardar `{ _id, nombre }` de `especie` y `raza` dentro del documento `Animal`

**Precaución:** Los datos duplicados pueden quedar desactualizados. Si se aplica, debe haber un mecanismo de sincronización (ej. hook `post('save')` en el modelo origen).

### 4.2 Computed Pattern

Almacenar valores precalculados para evitar cómputos repetitivos.

**Cuándo aplica:**
- Cuando las lecturas son mucho más frecuentes que las escrituras
- Ejemplo: `cantidadHijos` en `Animal` para evitar consultar hijos cada vez

**Implementación:**
```js
// Al asignar un padre/madre:
await Animal.findByIdAndUpdate(padreId, { $inc: { cantidadHijos: 1 } });
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
