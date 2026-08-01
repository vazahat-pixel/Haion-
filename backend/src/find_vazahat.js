import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function inspectDb() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Database Name:', mongoose.connection.name);
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    console.log(`Collection: ${c.name} -> ${count} docs`);
  }
  await mongoose.disconnect();
}

inspectDb().catch(console.error);
