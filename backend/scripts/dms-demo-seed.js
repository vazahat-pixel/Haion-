/**
 * Seeds DMS demo masters into a LOCAL/TEST database only.
 * Refuses to run unless MONGODB_URI points at localhost/127.0.0.1.
 *
 *   MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/dms-demo-seed.js
 *
 * Demo logins (test values for local use only):
 *   Admin        dms.admin@haion.local / DmsDemo@123   (MASTER_ADMIN)
 *   Branch user  login ID printed at the end        / DmsDemo@123
 */
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import { DmsMaster, DmsHsn, DmsProduct, DmsLocation, DmsProfile, DmsVendor } from '../src/dms/models/master.models.js';

const uri = process.env.MONGODB_URI || '';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(uri)) {
  console.error('Refusing to seed: MONGODB_URI must point at a local test database.');
  process.exit(1);
}
const PASSWORD = 'DmsDemo@123';

await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'haion_erp' });
const hash = await User.hashPassword(PASSWORD);

const admin = await User.findOneAndUpdate(
  { email: 'dms.admin@haion.local' },
  { email: 'dms.admin@haion.local', password: hash, firstName: 'DMS', lastName: 'Admin', phone: '9000000100', role: 'MASTER_ADMIN', isActive: true },
  { upsert: true, new: true },
);

const m = async (type, name, extra = {}) => DmsMaster.findOneAndUpdate({ type, name, parent: extra.parent || undefined }, { type, name, ...extra }, { upsert: true, new: true });
const brand = await m('brand', 'Haion');
const mobile = await m('category', 'MOBILE');
const acc = await m('category', 'MOBILE ACCESSORIES');
await m('subcategory', 'MOBILE HANDSET', { parent: mobile._id });
for (const c of ['NONE', 'BLACK', 'RED']) await m('color', c);
await m('courier', 'DTDC Express LTD', { code: 'DTDC', attrs: { city: 'Gurgaon', state: 'Haryana', contactPerson: 'Desk', phone: '9000000200' } });

await DmsHsn.findOneAndUpdate({ hsnCode: '85171300' }, { hsnCode: '85171300', description: 'Mobile phones', cgst: 9, sgst: 9, igst: 18 }, { upsert: true });
await DmsHsn.findOneAndUpdate({ hsnCode: '85044030' }, { hsnCode: '85044030', description: 'Chargers', cgst: 9, sgst: 9, igst: 18 }, { upsert: true });

const prod = (productCode, name, category, hsnCode, isSerialized, color = 'NONE') => DmsProduct.findOneAndUpdate(
  { productCode }, { productCode, name, category, brand: brand._id, hsnCode, isSerialized, color, warrantyDays: 365 }, { upsert: true, new: true },
);
await prod('PH100', 'Haion Phone 100', mobile._id, '85171300', true, 'BLACK');
await prod('CH20W', 'Haion 20W Charger', acc._id, '85044030', false);

const loc = (code, data) => DmsLocation.findOneAndUpdate({ code }, { code, ...data }, { upsert: true, new: true });
const ho = await loc('INHOUP001', { name: 'Demo Head Office', locationType: 'Head Office', state: 'Uttar Pradesh', stateCode: 'UP', city: 'Noida', billingAddress: 'B-32, Sector 57, Noida', docPrefix: 'NOI', region: 'NORTH' });
const br = await loc('INBRUP001', { name: 'Demo Branch Agra', locationType: 'Branch', state: 'Uttar Pradesh', stateCode: 'UP', city: 'Agra', billingAddress: 'Near Water Works, Agra', docPrefix: 'AGR', parent: ho._id, creditLimit: 500000, region: 'NORTH' });
await loc('DEDLMH001', { name: 'Demo Dealer Mumbai', locationType: 'Dealer', state: 'Maharashtra', stateCode: 'MH', city: 'Mumbai', billingAddress: 'Andheri East, Mumbai', docPrefix: 'MUM', parent: br._id, creditLimit: 200000, region: 'WEST' });
await DmsVendor.findOneAndUpdate({ code: 'VNDR1' }, { code: 'VNDR1', name: 'Demo Supplier Pvt Ltd', city: 'Noida', state: 'Uttar Pradesh', stateCode: 'UP', country: 'India', phone: '9000000300' }, { upsert: true });

const brUser = await User.findOneAndUpdate(
  { email: 'dms.branch@haion.local' },
  { email: 'dms.branch@haion.local', password: hash, firstName: 'Branch', lastName: 'User', phone: '9000000101', role: 'DMS_USER', isActive: true },
  { upsert: true, new: true },
);
await DmsProfile.findOneAndUpdate(
  { user: brUser._id },
  { user: brUser._id, loginId: 'INUSRBRUP900', displayName: 'Branch User', userType: 'Location User', location: br._id, status: 'Active',
    pages: ['home', 'po', 'receive', 'payment_receive', 'retail', 'serial_track', 'r_inventory', 'r_ledger', 'purchase_return', 'dispatch'] },
  { upsert: true },
);

console.log(`Seeded. Admin: dms.admin@haion.local  Branch login ID: INUSRBRUP900  (password ${PASSWORD}, admin id ${admin._id})`);
await mongoose.disconnect();
