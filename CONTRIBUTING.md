# Guía de contribución — LinajeAnimal

## Flujo de trabajo

```
main (producción)
  ▲ PR merge (solo desde develop)
  │
develop (integración)
  ▲ PR merge (desde feature branches)
  ├── feature/nombre-corto
  ├── fix/nombre-corto
  └── ...
```

**Reglas:**
- No hacer push directo a `main` ni a `develop`
- Todo cambio entra vía Pull Request a `develop`
- `develop` se mergea a `main` cuando está estable

## Ramas (branch naming)

```
feature/lo-que-sea    →  Nueva funcionalidad
fix/lo-que-sea        →  Corrección de bug
```

Siempre crear desde `develop`.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/mi-funcionalidad
```

## Commits (Conventional Commits)

```
feat:     Nueva funcionalidad
fix:      Corrección de bug
chore:    Mantenimiento, config, dependencias
docs:     Documentación
refactor: Mejora de código sin cambiar comportamiento
test:     Agregar o modificar tests
style:    Formato, linting (sin cambio funcional)
```

**Ejemplos:**
```
feat: agregar endpoint árbol genealógico con profundidad configurable
fix: validar que padre no sea descendiente del animal
docs: actualizar tabla de endpoints en README
```

## Pull Requests

1. **Título** descriptivo siguiendo conventional commits:
   ```
   feat: CRUD de animales con validaciones de parentesco
   ```

2. **Descripción** debe incluir:
   - Qué hace el cambio
   - Validaciones o reglas de negocio implementadas
   - Cómo probarlo

3. **Checklist antes de abrir el PR:**
   - [ ] El código corre sin errores (`node server.js`)
   - [ ] No hay `console.log` olvidados
   - [ ] Los endpoints se probaron con Postman o curl
   - [ ] Se siguen los estándares del proyecto (soft delete, validaciones, formato de respuesta)

4. **Review:** mínimo 1 aprobación antes de mergear a `develop`

## Estándares de código

### Arquitectura

```
routes/      →  solo definición de rutas y validaciones (express-validator)
controllers/ →  delgados: reciben req, llaman al service, responden
services/    →  lógica de negocio, validaciones de dominio, acceso a BD
```

### Reglas obligatorias

- **Soft delete siempre:** usar `findByIdAndUpdate(id, { active: false })`.  
  Prohibido: `deleteOne`, `findByIdAndDelete`, `deleteMany`.
- **Validar ObjectId** antes de cada consulta a BD (`.isMongoId()`).
- **Misma especie:** padre y madre deben pertenecer a la misma especie que el hijo.
- **Sexo correcto:** padre debe ser `macho`, madre debe ser `hembra`.
- **Respuesta consistente:**
  ```json
  { "success": true, "data": { ... } }
  { "success": false, "message": "..." }
  ```
- **Nunca devolver contraseñas** en las respuestas.
- **Sanitizar strings** con `.escape()` para prevenir NoSQL injection.

### Roles y autorización

| Rol | Permisos |
|-----|----------|
| `admin` | CRUD en cualquier entidad, gestión de usuarios |
| `user` | CRUD solo sobre animales donde es `propietario`, lectura de especies/razas |

## Antes de contribuir por primera vez

1. Asegúrate de ser colaborador del repositorio
2. Lee el README.md para setup y configuración
3. Crea tu rama desde `develop`
4. Cuando termines, abre un Pull Request a `develop`
