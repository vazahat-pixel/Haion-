import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const Customer = mongoose.model('Customer', new mongoose.Schema({}, { strict: false, collection: 'customers' }));

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const all = await Customer.find({}, 'name email phone code referralCode').lean();
  console.log('Total customers:', all.length);
  all.forEach(c => console.log(`- ${c.name} | ${c.email} | ${c.phone} | code:${c.code} | ref:${c.referralCode}`));
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
