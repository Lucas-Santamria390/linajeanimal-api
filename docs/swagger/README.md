# Documentación Swagger — LinajeAnimal

La API usa `swagger-jsdoc` para generar documentación OpenAPI 3.0.
Las fuentes de documentación son:

- `./routes/*.js` — anotaciones JSDoc `@openapi` (actualmente no se usan)
- `./docs/swagger/*.yml` — archivos YAML con definiciones de paths

Actualmente todo se documenta via archivos YAML en este directorio,
uno por módulo (`auth.yml`, `animales.yml`, etc.).

## Estructura de un archivo YAML

```yaml
paths:
  /api/v1/entidad:
    get:
      tags: [NombreModulo]
      summary: Descripción corta
      security:
        - bearerAuth: []            # Solo si requiere auth
      parameters:
        - in: query
          name: campo
          schema:
            type: string
          description: Descripción del parámetro
      responses:
        200:
          description: Descripción éxito
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Exito'
        401:
          description: No autenticado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        message:
          type: string
```

## Reglas

### 1. Un archivo `.yml` por módulo

| Módulo | Archivo |
|--------|---------|
| Auth | `docs/swagger/auth.yml` |
| Animales | `docs/swagger/animales.yml` |
| Especies | *(pendiente)* |
| Razas | *(pendiente)* |

### 2. Documentar siempre estas responses

Toda ruta debe documentar al menos los errores que puede devolver:

| Código | Cuándo ocurre |
|--------|---------------|
| `200` | Éxito (GET, PUT, DELETE, PATCH) |
| `201` | Creación exitosa (POST) |
| `400` | Validación falló / ID inválido |
| `401` | Token ausente o inválido |
| `403` | Sin permisos (rol insuficiente o no es propietario) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (duplicado, código 11000) |
| `500` | Error interno del servidor |

Usar `$ref: '#/components/schemas/Error'` para errores y definir
el schema `Error` en `components/schemas` al final del archivo.

### 3. bearerAuth

Toda ruta protegida debe incluir:
```yaml
security:
  - bearerAuth: []
```

El security scheme `bearerAuth` ya está definido en `config/swagger.js`,
no es necesario redefinirlo.

### 4. tags

Usar el mismo tag para todas las rutas del mismo módulo.
Los tags se definen inline como array de un solo elemento:
```yaml
tags: [Animales]
```

### 5. Path parameters

Documentar siempre el parámetro `id` en rutas con `{id}`:
```yaml
parameters:
  - in: path
    name: id
    required: true
    schema:
      type: string
    description: ID del recurso
```

### 6. requestBody con propiedades

Siempre listar las propiedades del body, con tipo, formato y descripción.
Usar `nullable: true` para campos opcionales que aceptan null.
```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [campo1, campo2]
        properties:
          campo1:
            type: string
            description: Descripción
          campo2:
            type: string
            nullable: true
```

### 7. Ejemplo completo

Ver `docs/swagger/auth.yml` como referencia de cómo documentar
registro, login y perfil con errores incluidos.
