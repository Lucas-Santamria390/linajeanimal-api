// Configuración de Swagger para documentación automática de la API
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LinajeAnimal API',
      version: '1.0.0',
      description: 'API REST para gestionar árbol genealógico de animales',
    },
    servers: [
      { url: process.env.API_URL || `http://localhost:${config.port}`, description: 'API server' },
    ],
    components: {
      // Esquema de seguridad JWT para endpoints protegidos
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // Escanea rutas y archivos yml para generar la documentación
  apis: ['./routes/*.js', './docs/swagger/*.yml'],
};

module.exports = swaggerJsdoc(options);
