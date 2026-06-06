const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');

const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.nodeEnv})`);
  });
};

start();
