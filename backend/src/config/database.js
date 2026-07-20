import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let memoryServer = null;

export async function connectDatabase() {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
  });

  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    dbName: env.mongodbDbName,
  };

  try {
    await mongoose.connect(env.mongodbUri, options);
    return mongoose.connection;
  } catch (err) {
    // Fall back to in-memory MongoDB for development AND test environments
    if (env.nodeEnv === 'production') throw err;

    console.warn(`MongoDB unavailable (${err.message})`);
    console.warn('Starting in-memory MongoDB…');

    memoryServer = await MongoMemoryServer.create();
    await mongoose.connect(memoryServer.getUri(), options);
    console.log('In-memory MongoDB ready');
    return mongoose.connection;
  }
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
