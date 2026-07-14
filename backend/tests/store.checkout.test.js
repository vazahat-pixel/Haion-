import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import CmsCollection from '../src/models/cms/CmsCollection.model.js';
import WebsiteOrder from '../src/models/WebsiteOrder.model.js';

let server;

before(async () => {
  await connectDatabase();
  await CmsCollection.deleteMany({ collection: 'products', 'data.id': '__test_product__' });
  await CmsCollection.create({
    collection: 'products',
    isVisible: true,
    order: 9999,
    data: {
      id: '__test_product__',
      name: 'Test Scooter',
      price: '₹1,000',
      category: 'evs',
      stock: 10,
      status: 'active',
      image: '/test.webp',
    },
  });
});

after(async () => {
  await CmsCollection.deleteMany({ collection: 'products', 'data.id': '__test_product__' });
  await WebsiteOrder.deleteMany({ customerName: 'Test Buyer' });
  await disconnectDatabase();
  if (server) server.close();
});

test('GET /api/store/config returns razorpay status', async () => {
  const res = await request(app).get('/api/store/config');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok('razorpayEnabled' in res.body.data);
});

test('POST /api/store/checkout COD creates order', async () => {
  const res = await request(app).post('/api/store/checkout').send({
    customerName: 'Test Buyer',
    phone: '9876543210',
    shippingAddress: 'Test Address, Noida',
    paymentMethod: 'cod',
    lineItems: [{ productId: '__test_product__', quantity: 1 }],
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.order.orderNo);
  assert.equal(res.body.data.order.paymentMethod, 'cod');
});

test('GET /api/store/orders/track requires matching phone', async () => {
  const created = await request(app).post('/api/store/checkout').send({
    customerName: 'Test Buyer',
    phone: '9876543210',
    shippingAddress: 'Test Address',
    paymentMethod: 'cod',
    lineItems: [{ productId: '__test_product__', quantity: 1 }],
  });
  const orderNo = created.body.data.order.orderNo;
  const bad = await request(app).get(`/api/store/orders/track/${orderNo}`).query({ phone: '0000000000' });
  assert.equal(bad.status, 404);
  const ok = await request(app).get(`/api/store/orders/track/${orderNo}`).query({ phone: '9876543210' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.orderNo, orderNo);
});
