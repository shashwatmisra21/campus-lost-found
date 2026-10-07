const env = require('./config/env');
const { connectDatabase } = require('./config/db');
const app = require('./app');

async function start() {
  const { mode } = await connectDatabase();
  if (env.seedOnEmpty) {
    const { seedIfEmpty } = require('./scripts/seed');
    await seedIfEmpty();
  }

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port} (${mode} database)`);
  });
}

start().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
