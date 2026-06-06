const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const especiesRoutes = require('./routes/especiesRoutes');
const razasRoutes = require('./routes/razasRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, data: { status: 'OK', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/especies', especiesRoutes);
app.use('/api/v1/razas', razasRoutes);

app.use(errorHandler);

module.exports = app;
