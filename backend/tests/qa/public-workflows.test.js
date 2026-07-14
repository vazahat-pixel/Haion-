import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import CmsCollection from '../../src/models/cms/CmsCollection.model.js';
import WebsiteOrder from '../../src/models/WebsiteOrder.model.js';
import { QA_USERS, ensureQaFixture, loginToken, authed, assertSuccess } from '../helpers/qa.harness.js';

const TEST_PRODUCT_ID = '__qa_workflow_product__';

before(async () => {
  await connectDatabase();
  await ensureQaFixture();
  await CmsCollection.deleteMany({ collection: 'products', 'data.id': TEST_PRODUCT_ID });
  await CmsCollection.create({
    collection: 'products',
    isVisible: true,
    order: 9998,
    data: {
      id: TEST_PRODUCT_ID,
      name: 'QA Workflow Scooter',
      price: '₹1,000',
      category: 'evs',
      stock: 5,
      status: 'active',
      image: '/test.webp',
    },
  });
});

after(async () => {
  await CmsCollection.deleteMany({ collection: 'products', 'data.id': TEST_PRODUCT_ID });
  await WebsiteOrder.deleteMany({ customerName: 'QA Workflow Buyer' });
  await disconnectDatabase();
});

describe('QA — Public / guest endpoints', () => {
  test('GET /api/health', async () => {
    const res = await request(app).get('/api/health');
    assertSuccess(res, 'health');
  });

  test('GET /api/store/config (no auth)', async () => {
    const res = await request(app).get('/api/store/config');
    assertSuccess(res, 'store config');
    assert.ok('razorpayEnabled' in res.body.data);
  });

  test('GET /api/customer-panel/config (no auth)', async () => {
    const res = await request(app).get('/api/customer-panel/config');
    assertSuccess(res, 'customer portal config');
  });

  test('GET /api/cms/settings (public CMS)', async () => {
    const res = await request(app).get('/api/cms/settings');
    assert.ok([200, 404].includes(res.status), 'cms settings');
  });
});

describe('QA — Online store workflow (public → admin)', () => {
  test('COD checkout → track → admin list', async () => {
    const checkout = await request(app).post('/api/store/checkout').send({
      customerName: 'QA Workflow Buyer',
      phone: '9999988888',
      shippingAddress: 'QA Test Address, Jaipur',
      paymentMethod: 'cod',
      lineItems: [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
    });
    assert.equal(checkout.status, 201);
    assert.equal(checkout.body.success, true);
    const orderNo = checkout.body.data.order.orderNo;
    assert.ok(orderNo);

    const track = await request(app)
      .get(`/api/store/orders/track/${orderNo}`)
      .query({ phone: '9999988888' });
    assertSuccess(track, 'order track');
    assert.equal(track.body.data.orderNo, orderNo);

    const { token } = await loginToken(QA_USERS.admin.email);
    const adminList = await authed(token).get('/api/store/orders');
    assertSuccess(adminList, 'admin store orders');
    const found = (adminList.body.data || []).some((o) => o.orderNo === orderNo);
    assert.ok(found, 'admin should see website order');
  });
});

describe('QA — Supply chain read workflow', () => {
  test('admin inventory → dispatch → dealer GRN queue', async () => {
    const { token: adminToken } = await loginToken(QA_USERS.admin.email);
    const inv = await authed(adminToken).get('/api/inventory');
    assertSuccess(inv, 'admin inventory');

    const dispatch = await authed(adminToken).get('/api/dispatch');
    assertSuccess(dispatch, 'admin dispatch');

    const { token: dealerToken } = await loginToken(QA_USERS.dealerAdmin.email);
    const grn = await authed(dealerToken).get('/api/dealer/grn');
    assertSuccess(grn, 'dealer GRN');
  });

  test('dealer billing catalog accessible for sales flow', async () => {
    const { token } = await loginToken(QA_USERS.dealerSales.email);
    const catalog = await authed(token).get('/api/dealer/billing-catalog');
    assertSuccess(catalog, 'billing catalog');
  });
});
