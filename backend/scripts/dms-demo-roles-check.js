/**
 * Role / data-visibility check against the seeded demo database (read-only).
 *   MONGODB_URI=mongodb://127.0.0.1:27999/ node scripts/dms-demo-roles-check.js
 * Signs in (in-process) as HQ, a branch and a dealer user and proves the server returns only what each role may see.
 */
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../src/config/env.js';
import User from '../src/models/User.model.js';
import dmsRoutes from '../src/dms/index.js';
import { errorHandler } from '../src/middleware/errorHandler.middleware.js';
import { DmsInvoice, DmsPayment } from '../src/dms/models/txn.models.js';

const URI = process.env.MONGODB_URI || '';
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(URI)) { console.error('Local database only.'); process.exit(1); }
await mongoose.connect(URI, { dbName: process.env.DMS_DEMO_DB || 'dms_demo' });
const app = express(); app.use(express.json()); app.use('/api/dms', dmsRoutes); app.use(errorHandler);
const tok = async (email) => jwt.sign({ userId: (await User.findOne({ email }))._id }, env.jwtAccessSecret, { expiresIn: '1h' });
const get = (t, u) => request(app).get(`/api/dms${u}`).set('Authorization', `Bearer ${t}`);
const T = { admin: await tok('dms.admin@demo.haion.local'), ho: await tok('ho@demo.haion.local'), agra: await tok('agra@demo.haion.local'), kma: await tok('kma@demo.haion.local'), pct: await tok('pct@demo.haion.local') };
const rows = [];
const add = (role, check, expected, actual) => rows.push({ role, check, expected: String(expected), actual: String(actual), result: String(expected) === String(actual) ? 'PASS' : 'FAIL' });

const locs = await mongoose.connection.db.collection('dms_locations').find().toArray();
const id = (name) => String(locs.find((l) => l.name === name)._id);
const agraSub = new Set([id('Haion Branch Agra'), id('Krishna Mobiles'), id('Sharma Distributors')]);

// invoices visible
const invCount = async (t) => (await get(t, '/invoices?kind=CORPORATE&perPage=100&page=1')).body.pagination?.total;
const total = await DmsInvoice.countDocuments({ kind: 'CORPORATE' });
add('ho', 'corporate invoices visible = all', total, await invCount(T.ho));
const agraExpected = await DmsInvoice.countDocuments({ kind: 'CORPORATE', $or: [{ 'from.location': { $in: [...agraSub].map((x) => new mongoose.Types.ObjectId(x)) } }, { 'to.location': { $in: [...agraSub].map((x) => new mongoose.Types.ObjectId(x)) } }] });
add('agra', 'corporate invoices = only Agra subtree', agraExpected, await invCount(T.agra));
add('agra', 'does NOT see a Jaipur dealer PO', 0, (await get(T.agra, `/po?search=PCT`)).body.data?.filter((p) => /Pink City/.test(p.from?.name)).length);
const kmaExpected = await DmsInvoice.countDocuments({ kind: 'CORPORATE', $or: [{ 'from.location': new mongoose.Types.ObjectId(id('Krishna Mobiles')) }, { 'to.location': new mongoose.Types.ObjectId(id('Krishna Mobiles')) }] });
add('kma (dealer)', 'corporate invoices = only its own', kmaExpected, await invCount(T.kma));
add('kma (dealer)', 'party ledger of ANOTHER location is refused', 403, (await get(T.kma, `/reports/party-ledger?location=${id('Pink City Telecom')}&from=2026-01-01`)).status);
add('kma (dealer)', 'party ledger of own location allowed', 200, (await get(T.kma, `/reports/party-ledger?location=${id('Krishna Mobiles')}&from=2026-01-01`)).status);
add('kma (dealer)', 'Master Management (brand list) refused', 403, (await get(T.kma, '/masters/brand')).status);
add('kma (dealer)', 'User master refused', 403, (await get(T.kma, '/users')).status);
add('kma (dealer)', 'Salary generate/sheet (HR) refused', 403, (await get(T.kma, '/entities/salary')).status);
add('kma (dealer)', 'sees own leaves only (mine view allowed)', 200, (await get(T.kma, '/entities/leave?view=mine')).status);
add('kma (dealer)', 'cannot list all leaves', 403, (await get(T.kma, '/entities/leave')).status);
add('agra (branch)', 'can list leaves for approval', 200, (await get(T.agra, '/entities/leave?queue=approval')).status);
add('agra (branch)', 'approval queue only has Agra-subtree people', 0, ((await get(T.agra, '/entities/leave?queue=approval&perPage=100')).body.data || []).filter((l) => !['Krishna Vikas', 'Vikas Gupta', 'Pankaj Sharma', 'Anil Kapoor'].includes(l.createdByName)).length);
const payTotal = await DmsPayment.countDocuments({ kind: 'RECEIPT' });
add('ho', 'receipts visible = all', payTotal, (await get(T.ho, '/payments?perPage=1')).body.pagination?.total);
add('agra', 'receipts visible < all', true, ((await get(T.agra, '/payments?perPage=1')).body.pagination?.total) < payTotal);
add('kma (dealer)', 'dashboard scoped (Sale tile ≤ HQ)', true, (await get(T.kma, '/reports/dashboard')).body.data.tiles.sale.amount < (await get(T.ho, '/reports/dashboard')).body.data.tiles.sale.amount);
add('pct (Jaipur dealer)', 'cannot open a Krishna Mobiles invoice', 404, (await get(T.pct, `/invoices/${(await DmsInvoice.findOne({ kind: 'CORPORATE', 'to.location': new mongoose.Types.ObjectId(id('Krishna Mobiles')) }))._id}`)).status);

console.table(rows);
const fails = rows.filter((r) => r.result === 'FAIL');
console.log(fails.length ? `${fails.length} FAILED` : `All ${rows.length} role checks passed`);
await mongoose.disconnect();
process.exit(fails.length ? 1 : 0);
