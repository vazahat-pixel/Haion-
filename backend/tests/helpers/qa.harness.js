import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/models/User.model.js';
import Warehouse from '../../src/models/Warehouse.model.js';
import Dealer from '../../src/models/Dealer.model.js';
import Product from '../../src/models/Product.model.js';
import Inventory from '../../src/models/Inventory.model.js';
import Customer from '../../src/models/Customer.model.js';
import { ROLES } from '../../src/config/constants.js';
import { syncMissingRolePermissions } from '../../src/services/permission.service.js';

/** Seed-aligned QA accounts — password: `password` */
export const QA_USERS = {
  admin: { email: 'admin@haion.com', password: 'password', role: ROLES.MASTER_ADMIN },
  warehouse: { email: 'warehouse@haion.com', password: 'password', role: ROLES.WAREHOUSE_MANAGER },
  dealerAdmin: { email: 'dealer@haion.com', password: 'password', role: ROLES.DEALER_ADMIN },
  dealerSales: { email: 'sales@haion.com', password: 'password', role: ROLES.DEALER_SALES },
  employee: { email: 'employee@haion.com', password: 'password', role: ROLES.EMPLOYEE },
  manager: { email: 'manager@haion.com', password: 'password', role: ROLES.MANAGER },
  support: { email: 'support@haion.com', password: 'password', role: ROLES.CUSTOMER_SUPPORT },
  service: { email: 'service@haion.com', password: 'password', role: ROLES.SERVICE_CENTER },
  customer: { email: 'customer@haion.com', password: 'password', role: ROLES.CUSTOMER },
};

let fixtureReady = false;
let fixturePromise = null;

async function safeFindOrCreate(Model, query, data) {
  let doc = await Model.findOne(query);
  if (doc) return doc;
  try {
    return await Model.create(data);
  } catch (err) {
    if (err?.code === 11000) return Model.findOne(query);
    throw err;
  }
}

export async function ensureQaFixture() {
  if (fixtureReady) return;
  if (fixturePromise) return fixturePromise;

  fixturePromise = (async () => {
  await syncMissingRolePermissions();

  const warehouse = await safeFindOrCreate(Warehouse, { code: 'WH-QA' }, {
    code: 'WH-QA',
    name: 'QA Warehouse',
    city: 'Jaipur',
    state: 'Rajasthan',
    capacity: 1000,
    managerName: 'QA Manager',
  });

  const dealer = await safeFindOrCreate(Dealer, { code: 'DLR-QA' }, {
    code: 'DLR-QA',
    name: 'QA Motors',
    city: 'Jaipur',
    state: 'Rajasthan',
    gstin: '08AABCS1429B1Z5',
    status: 'ACTIVE',
    creditLimit: 500000,
    outstanding: 0,
    teamSize: 2,
  });

  const userDefs = [
    { ...QA_USERS.admin, firstName: 'Master', lastName: 'Admin', phone: '9876543210' },
    { ...QA_USERS.warehouse, firstName: 'Ravi', lastName: 'Kumar', phone: '9876543211', warehouseId: warehouse._id },
    { ...QA_USERS.dealerAdmin, firstName: 'Dealer', lastName: 'Admin', phone: '9876543212', dealerId: dealer._id },
    { ...QA_USERS.dealerSales, firstName: 'Dealer', lastName: 'Sales', phone: '9876543213', dealerId: dealer._id },
    { ...QA_USERS.employee, firstName: 'Field', lastName: 'Employee', phone: '9876543214' },
    { ...QA_USERS.manager, firstName: 'Sales', lastName: 'Manager', phone: '9876543215' },
    { ...QA_USERS.support, firstName: 'Customer', lastName: 'Support', phone: '9876543216' },
    { ...QA_USERS.service, firstName: 'Service', lastName: 'Center', phone: '9876543217' },
    { ...QA_USERS.customer, firstName: 'Rajesh', lastName: 'Singh', phone: '9876543218' },
  ];

  for (const u of userDefs) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      const hashed = await User.hashPassword(u.password);
      user = await User.create({ ...u, password: hashed });
    } else {
      const patch = {};
      if (u.warehouseId && !user.warehouseId) patch.warehouseId = u.warehouseId;
      if (u.dealerId && !user.dealerId) patch.dealerId = u.dealerId;
      if (Object.keys(patch).length) {
        Object.assign(user, patch);
        await user.save();
      }
    }
  }

  await safeFindOrCreate(Product, { sku: 'SKU-QA-001' }, {
    name: 'QA Test Motor',
    sku: 'SKU-QA-001',
    category: 'Motors',
    hsnCode: '8501',
  });

  await safeFindOrCreate(Inventory, { sku: 'SKU-QA-001', warehouse: warehouse._id }, {
    sku: 'SKU-QA-001',
    name: 'QA Test Motor',
    category: 'Motors',
    hsn: '8501',
    quantity: 50,
    unitPrice: 10000,
    warehouse: warehouse._id,
    reorderLevel: 5,
  });

  const customerUser = await User.findOne({ email: QA_USERS.customer.email });
  if (customerUser) {
    await safeFindOrCreate(Customer, { code: 'CUS-QA-001' }, {
      code: 'CUS-QA-001',
      name: 'Rajesh Singh',
      phone: '9876543218',
      email: QA_USERS.customer.email,
      city: 'Jaipur',
      state: 'Rajasthan',
      dealer: dealer._id,
      userId: customerUser._id,
      status: 'ACTIVE',
    });
  }

  fixtureReady = true;
  })();

  return fixturePromise;
}

export async function login(email, password = 'password') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res;
}

export function authed(token) {
  const agent = request(app);
  const auth = (req) => req.set('Authorization', `Bearer ${token}`);
  return {
    get: (path) => auth(agent.get(path)),
    post: (path, body) => auth(agent.post(path)).send(body),
    patch: (path, body) => auth(agent.patch(path)).send(body),
    delete: (path) => auth(agent.delete(path)),
  };
}

export async function loginToken(email, password = 'password') {
  const res = await login(email, password);
  assert.equal(res.status, 200, `Login failed for ${email}: ${JSON.stringify(res.body)}`);
  assert.ok(res.body.data?.accessToken, `No token for ${email}`);
  return { token: res.body.data.accessToken, user: res.body.data.user };
}

export function assertSuccess(res, label, allowed = [200]) {
  assert.ok(allowed.includes(res.status), `${label}: expected ${allowed.join('|')} got ${res.status} — ${JSON.stringify(res.body)}`);
  if (res.status !== 204) {
    assert.equal(res.body.success, true, `${label}: success flag false`);
  }
}

export function assertForbidden(res, label) {
  assert.ok([401, 403].includes(res.status), `${label}: expected 401/403 got ${res.status}`);
}
