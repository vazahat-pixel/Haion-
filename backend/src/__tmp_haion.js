import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  const haionDb = conn.connection.getClient().db('haion_erp');
  
  const collections = await haionDb.listCollections().toArray();
  console.log('Collections in haion_erp:', collections.map(c => c.name).join(', '));
  
  const customersCol = haionDb.collection('customers');
  const count = await customersCol.countDocuments();
  console.log(`\nTotal customers in haion_erp: ${count}`);
  
  if (count > 0) {
    const customers = await customersCol.find({}, { 
      projection: { name: 1, email: 1, phone: 1, code: 1, referralCode: 1 } 
    }).toArray();
    console.log('\nAll customers:');
    customers.forEach(c => console.log(`- ${c.name} | Email: ${c.email} | Phone: ${c.phone} | Code: ${c.code} | Ref: ${c.referralCode}`));
  }
  
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
