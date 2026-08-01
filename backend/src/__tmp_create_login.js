import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const TEST_PASSWORD = 'Test@1234';

async function run() {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  const haionDb = conn.connection.getClient().db('haion_erp');
  
  const customersCol = haionDb.collection('customers');
  const usersCol = haionDb.collection('users');
  
  const customer = await customersCol.findOne({ name: 'Vazahat Qureshi' });
  
  if (!customer) {
    console.log('Customer not found');
    await mongoose.disconnect();
    return;
  }
  
  console.log('Customer found:');
  console.log('  Name:', customer.name);
  console.log('  Email:', customer.email);
  console.log('  Phone:', customer.phone);
  console.log('  Referral Code:', customer.referralCode);
  
  const email = customer.email.toLowerCase();
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);
  
  let user = await usersCol.findOne({ email });
  
  if (user) {
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          role: 'CUSTOMER',
          isActive: true,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }
    );
    console.log('\n✓ Existing login user — password reset');
  } else {
    const [firstName, ...rest] = (customer.name || 'Customer').split(' ');
    const result = await usersCol.insertOne({
      email,
      password: hashedPassword,
      firstName: firstName || 'Customer',
      lastName: rest.join(' ') || 'User',
      phone: customer.phone || '0000000000',
      role: 'CUSTOMER',
      isActive: true,
      avatar: null,
      dealerId: null,
      employeeId: null,
      serviceCenterId: null,
      warehouseId: null,
      refreshTokens: [],
      lastLogin: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('\n✓ New login user created');
  }
  
  console.log('\n--- TEST LOGIN CREDENTIALS ---');
  console.log('Email:', email);
  console.log('Password:', TEST_PASSWORD);
  console.log('\nReferral Code:', customer.referralCode);
  
  await mongoose.disconnect();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
