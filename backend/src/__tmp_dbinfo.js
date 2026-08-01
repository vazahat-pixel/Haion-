import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to cluster - DB:', conn.connection.name);
  const adminDb = conn.connection.getClient().db('admin');
  const databases = await adminDb.admin().listDatabases();
  console.log('\nAvailable databases:');
  databases.databases.forEach(db => console.log(`  - ${db.name}`));
  
  const currentDb = conn.connection.db;
  const collections = await currentDb.listCollections().toArray();
  console.log(`\nCollections in "${conn.connection.name}":`, collections.map(c => c.name).join(', '));
  
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
