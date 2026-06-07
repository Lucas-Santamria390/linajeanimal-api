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
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './docs/swagger/*.yml'],
};

module.exports = swaggerJsdoc(options);
