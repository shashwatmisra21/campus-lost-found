const mongoose = require('mongoose');
const env = require('./env');

let memoryServer;

async function connectDatabase() {
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri);
      console.log('Connected to MongoDB');
      return { mode: 'remote' };
    } catch (error) {
      console.warn('Could not connect to MONGO_URI, falling back to in-memory MongoDB.');
      console.warn(error.message);
    }
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  console.log('Using in-memory MongoDB (data resets when the process exits).');
  return { mode: 'memory' };
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDatabase, disconnectDatabase };
