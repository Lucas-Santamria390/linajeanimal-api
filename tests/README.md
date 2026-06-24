# Tests — LinajeAnimal API

## Cómo ejecutar

```bash
npm test
```

Esto corre Jest con `--runInBand` (tests en serie) y `--detectOpenHandles`.

### Primera ejecución

La primera vez, `mongodb-memory-server` descarga el binario de MongoDB (~781 MB) automáticamente en el `pretest`. Se guarda en caché local; las siguientes ejecuciones son inmediatas.

## Estructura

```
tests/
├── README.md
├── setup-env.js          # Variables de entorno para tests
├── db-helper.js          # Helpers de conexión a BD en memoria
└── *.test.js             # Suites de tests
```

## Helpers de BD (`db-helper.js`)

| Función | Uso |
|---|---|
| `conectarTestDB()` | Crea una instancia de MongoDB en memoria y conecta Mongoose |
| `desconectarTestDB()` | Desconecta Mongoose y detiene el servidor en memoria |
| `limpiarTestDB()` | Elimina todos los documentos de todas las colecciones |

## Reglas / Convenciones

1. **No conectar BD si no se necesita** — Endpoints como health check no tocan BD. No agregues `beforeAll` con `conectarTestDB` innecesariamente.

2. **Timeout en hooks de BD** — `conectarTestDB()` puede tardar (descarga de binario la primera vez). Usar timeout de 120000 ms en `beforeAll`:

   ```js
   beforeAll(async () => {
     await conectarTestDB();
   }, 120000);
   ```

3. **Cerrar siempre la conexión** — Usar `desconectarTestDB()` en `afterAll`. Ya tiene `try/finally` para cerrar incluso si falla.

4. **Limpiar datos entre tests** — Si los tests modifican la BD, usar `limpiarTestDB()` en `beforeEach`.

5. **Archivos de test** — Nombrar como `nombre-modulo.test.js`. Cada archivo es una suite independiente.

## Templates

### Test sin BD (ej: health check)

```js
const request = require('supertest');
const app = require('../app');

describe('Mi módulo', () => {
  it('debería responder correctamente', async () => {
    const res = await request(app).get('/api/v1/mi-endpoint');
    expect(res.statusCode).toEqual(200);
  });
});
```

### Test con BD

```js
const request = require('supertest');
const app = require('../app');
const { conectarTestDB, desconectarTestDB, limpiarTestDB } = require('./db-helper');

describe('Mi módulo', () => {
  beforeAll(async () => {
    await conectarTestDB();
  }, 120000);

  afterAll(async () => {
    await desconectarTestDB();
  });

  beforeEach(async () => {
    await limpiarTestDB();
  });

  it('debería crear un recurso', async () => {
    const res = await request(app).post('/api/v1/mi-endpoint').send({ /* ... */ });
    expect(res.statusCode).toEqual(201);
  });
});
```

## Notas

- `jest.config.js` tiene `testTimeout: 30000` para tests individuales y `forceExit: true` para evitar hangs.
- Las variables de entorno se cargan desde `setup-env.js`. No dependen de `.env`.
