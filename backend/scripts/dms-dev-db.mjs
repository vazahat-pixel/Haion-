/**
 * Starts a throw-away in-memory MongoDB for local DMS testing so the real
 * MONGODB_URI is never touched. Keeps running until killed.
 *   node scripts/dms-dev-db.mjs            → mongodb://127.0.0.1:27999/
 * Then run the backend with MONGODB_URI=mongodb://127.0.0.1:27999/ and
 * seed it with `node scripts/dms-demo-seed.js`.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const port = Number(process.env.DMS_DEV_DB_PORT || 27999);
const server = await MongoMemoryServer.create({ instance: { port, ip: '127.0.0.1' } });
console.log(`DMS dev MongoDB ready at ${server.getUri()}`);
const stop = async () => { await server.stop(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
