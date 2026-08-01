import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

const customerSchema = new mongoose.Schema({}, { strict: false, collection: 'customers' });
const Customer = mongoose.model('Customer', customerSchema);

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

const TEST_PASSWORD = 'Test@1234';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);

  const customer = await Customer.findOne({ name: { $regex: 'vazahat', $options: 'i' } }).lean();

  if (!customer) {
    console.log('No customer found matching "vazahat"');
    await mongoose.disconnect();
    return;
  }

  console.log('\n--- Customer found ---');
  console.log('Name:', customer.name);
  console.log('Code:', customer.code);
  console.log('Email:', customer.email);
  console.log('Phone:', customer.phone);
  console.log('Referral Code:', customer.referralCode);

  if (!customer.email) {
    console.log('\nCustomer has no email set — cannot create/link a login User via email.');
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 12);
  const email = customer.email.toLowerCase();

  let user = await User.findOne({ email });

  if (user) {
    await User.updateOne(
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
    console.log('\nExisting login user found — password reset.');
  } else {
    const [firstName, ...rest] = (customer.name || 'Customer').split(' ');
    await User.create({
      email,
      password: hashedPassword,
      firstName: firstName || 'Customer',
      lastName: rest.join(' ') || 'User',
      phone: customer.phone || '0000000000',
      role: 'CUSTOMER',
      isActive: true,
    });
    console.log('\nNo login user existed — created a new one.');
  }

  console.log('\n--- Login credentials (test) ---');
  console.log('Email:', email);
  console.log('Password:', TEST_PASSWORD);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
