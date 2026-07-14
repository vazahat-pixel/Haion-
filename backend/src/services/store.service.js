import CmsCollection from '../models/cms/CmsCollection.model.js';
import WebsiteSettings from '../models/cms/WebsiteSettings.model.js';
import WebsiteOrder from '../models/WebsiteOrder.model.js';
import User from '../models/User.model.js';
import { parsePrice, toPaise } from '../utils/price.util.js';
import { createRazorpayOrder, isRazorpayConfigured } from './razorpay.service.js';
import { notifyUser } from './notification.service.js';
import { env } from '../config/env.js';

function generateOrderNo(prefix = 'HAION-') {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${n}`;
}

async function getCheckoutSettings() {
  const settings = await WebsiteSettings.findOne().lean();
  return settings?.checkout ?? { orderIdPrefix: 'HAION-', merchantName: 'Haion' };
}

async function loadCmsProducts() {
  const rows = await CmsCollection.find({ collection: 'products', isVisible: true }).lean();
  return rows
    .map((row) => ({ cmsItemId: String(row._id), ...row.data }))
    .filter((p) => {
      const status = p.status || 'active';
      return status === 'active';
    });
}

function resolveProduct(products, productId) {
  return products.find((p) => p.id === productId || String(p.cmsItemId) === productId);
}

export function buildLineItems(products, cartItems) {
  const lineItems = [];
  for (const item of cartItems) {
    const product = resolveProduct(products, item.productId);
    if (!product) {
      const err = new Error(`Product not found: ${item.productId}`);
      err.statusCode = 400;
      throw err;
    }
    const qty = Math.max(1, Number(item.quantity) || 1);
    const stock = product.stock;
    if (stock != null && stock !== '' && Number(stock) < qty) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }
    const unitPrice = parsePrice(product.salePrice || product.price);
    if (unitPrice <= 0) {
      const err = new Error(`Invalid price for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }
    lineItems.push({
      productId: product.id || item.productId,
      cmsItemId: product.cmsItemId,
      name: product.name,
      image: product.image || product.images?.[0] || item.image || '',
      color: item.color || '',
      sku: product.sku || '',
      quantity: qty,
      unitPrice,
      amount: unitPrice * qty,
    });
  }
  return lineItems;
}

async function decrementStock(lineItems) {
  for (const item of lineItems) {
    if (!item.cmsItemId) continue;
    const doc = await CmsCollection.findOne({ _id: item.cmsItemId, collection: 'products' });
    if (!doc?.data) continue;
    const stock = doc.data.stock;
    if (stock == null || stock === '') continue;
    const next = Math.max(0, Number(stock) - item.quantity);
    doc.data.stock = next;
    doc.markModified('data');
    await doc.save();
  }
}

async function notifyAdminsNewOrder(order) {
  const admins = await User.find({ role: 'MASTER_ADMIN', isActive: { $ne: false } }).select('_id').lean();
  await Promise.all(
    admins.map((admin) =>
      notifyUser({
        userId: admin._id,
        title: 'New website order',
        message: `${order.orderNo} — ₹${order.total.toLocaleString('en-IN')} from ${order.customerName}`,
        type: 'SYSTEM',
        module: 'Store',
        resourceId: order.orderNo,
        link: `/admin/store-orders`,
      })
    )
  );
}

function resolveRazorpayChargePaise(catalogTotalPaise) {
  const devTestRupees = env.razorpayDevTestAmount;
  if (env.isDev && devTestRupees != null && devTestRupees > 0) {
    return toPaise(devTestRupees);
  }
  return catalogTotalPaise;
}

export async function createWebsiteCheckout(payload) {
  const { customerName, phone, email, shippingAddress, lineItems: cartItems, paymentMethod } = payload;
  if (!customerName?.trim() || !phone?.trim() || !shippingAddress?.trim()) {
    const err = new Error('Name, phone and shipping address are required');
    err.statusCode = 400;
    throw err;
  }
  if (!Array.isArray(cartItems) || !cartItems.length) {
    const err = new Error('Cart is empty');
    err.statusCode = 400;
    throw err;
  }
  if (!['cod', 'razorpay'].includes(paymentMethod)) {
    const err = new Error('Invalid payment method');
    err.statusCode = 400;
    throw err;
  }
  if (paymentMethod === 'razorpay' && !isRazorpayConfigured()) {
    const err = new Error('Online payment is not available');
    err.statusCode = 503;
    throw err;
  }

  const products = await loadCmsProducts();
  const lineItems = buildLineItems(products, cartItems);
  const subtotal = lineItems.reduce((sum, l) => sum + l.amount, 0);
  const items = lineItems.reduce((sum, l) => sum + l.quantity, 0);
  const checkoutSettings = await getCheckoutSettings();
  const orderNo = generateOrderNo(checkoutSettings.orderIdPrefix || 'HAION-');

  const isCod = paymentMethod === 'cod';
  const doc = await WebsiteOrder.create({
    orderNo,
    customerName: customerName.trim(),
    phone: phone.trim(),
    email: email?.trim(),
    shippingAddress: shippingAddress.trim(),
    lineItems,
    items,
    subtotal,
    total: subtotal,
    paymentMethod,
    paymentStatus: isCod ? 'cod_pending' : 'pending',
    status: isCod ? 'CONFIRMED' : 'PENDING',
    placedAt: new Date(),
    eta: new Date(Date.now() + 5 * 86400000),
    timeline: [
      {
        title: isCod ? 'Order placed (COD)' : 'Order initiated — awaiting payment',
        variant: isCod ? 'success' : 'warning',
        at: new Date(),
      },
    ],
  });

  if (isCod) {
    await decrementStock(lineItems);
    await notifyAdminsNewOrder(doc);
    return { order: doc.toObject(), razorpay: null };
  }

  const catalogAmountPaise = toPaise(subtotal);
  const amountPaise = resolveRazorpayChargePaise(catalogAmountPaise);
  const isDevTestCharge = amountPaise !== catalogAmountPaise;

  const razorpayOrder = await createRazorpayOrder({
    amountPaise,
    receipt: orderNo,
    notes: {
      websiteOrderId: String(doc._id),
      orderNo,
      catalogTotal: String(subtotal),
      devTestCharge: isDevTestCharge ? 'true' : 'false',
    },
  });

  doc.razorpayOrderId = razorpayOrder.id;
  if (isDevTestCharge) {
    doc.razorpayChargeAmount = amountPaise / 100;
    doc.timeline.push({
      title: 'Dev test payment',
      description: `Razorpay charged ₹${amountPaise / 100} (catalog total ₹${subtotal.toLocaleString('en-IN')})`,
      variant: 'warning',
      at: new Date(),
    });
  }
  await doc.save();

  return {
    order: doc.toObject(),
    razorpay: {
      keyId: env.razorpayKeyId,
      orderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      merchantName: checkoutSettings.merchantName || 'Haion',
      testCharge: isDevTestCharge,
      catalogTotal: subtotal,
      chargeAmount: amountPaise / 100,
    },
  };
}

export async function verifyWebsitePayment({ websiteOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const { verifyPaymentSignature } = await import('./razorpay.service.js');
  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!valid) {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }

  const doc = await WebsiteOrder.findById(websiteOrderId);
  if (!doc) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  if (doc.paymentStatus === 'paid') {
    return doc.toObject();
  }
  if (doc.razorpayOrderId && doc.razorpayOrderId !== razorpay_order_id) {
    const err = new Error('Payment order mismatch');
    err.statusCode = 400;
    throw err;
  }

  doc.paymentStatus = 'paid';
  doc.status = 'CONFIRMED';
  doc.razorpayPaymentId = razorpay_payment_id;
  doc.razorpaySignature = razorpay_signature;
  doc.paidAt = new Date();
  doc.timeline.push({
    title: 'Payment received via Razorpay',
    variant: 'success',
    at: new Date(),
  });
  await doc.save();
  await decrementStock(doc.lineItems);
  await notifyAdminsNewOrder(doc);
  return doc.toObject();
}

export async function trackWebsiteOrder(orderNo, phone) {
  const filter = { orderNo: String(orderNo).trim().toUpperCase() };
  const doc = await WebsiteOrder.findOne(filter).lean();
  if (!doc) return null;
  if (phone && doc.phone.replace(/\D/g, '') !== String(phone).replace(/\D/g, '')) {
    return null;
  }
  return doc;
}

const STATUS_FLOW = {
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
};

export async function updateWebsiteOrderStatus(id, { status, notes, trackingNo, eta }) {
  const doc = await WebsiteOrder.findById(id);
  if (!doc) {
    const err = new Error('Order not found');
    err.statusCode = 404;
    throw err;
  }
  const allowed = STATUS_FLOW[doc.status] || [];
  if (!allowed.includes(status)) {
    const err = new Error(`Cannot transition from ${doc.status} to ${status}`);
    err.statusCode = 400;
    throw err;
  }
  doc.status = status;
  if (trackingNo) doc.trackingNo = trackingNo;
  if (eta) doc.eta = eta;
  const titleMap = {
    CONFIRMED: 'Order confirmed',
    PROCESSING: 'Order is being processed',
    IN_TRANSIT: 'Order shipped — in transit',
    DELIVERED: 'Order delivered',
    CANCELLED: 'Order cancelled',
  };
  doc.timeline.push({
    title: titleMap[status] || `Status: ${status}`,
    description: notes,
    variant: status === 'DELIVERED' ? 'success' : status === 'CANCELLED' ? 'danger' : 'default',
    at: new Date(),
  });
  await doc.save();
  return doc.toObject();
}

export async function storeSalesSummary() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidMatch = { paymentStatus: { $in: ['paid', 'cod_pending'] }, status: { $ne: 'CANCELLED' } };

  const [todayAgg, monthAgg, totalOrders, pendingCod, onlinePaid] = await Promise.all([
    WebsiteOrder.aggregate([
      { $match: { ...paidMatch, placedAt: { $gte: startOfDay } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    WebsiteOrder.aggregate([
      { $match: { ...paidMatch, placedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]),
    WebsiteOrder.countDocuments({ status: { $ne: 'CANCELLED' } }),
    WebsiteOrder.countDocuments({ paymentMethod: 'cod', status: { $in: ['CONFIRMED', 'PROCESSING', 'IN_TRANSIT'] } }),
    WebsiteOrder.countDocuments({ paymentMethod: 'razorpay', paymentStatus: 'paid' }),
  ]);

  return {
    todayRevenue: todayAgg[0]?.revenue || 0,
    todayOrders: todayAgg[0]?.orders || 0,
    monthRevenue: monthAgg[0]?.revenue || 0,
    monthOrders: monthAgg[0]?.orders || 0,
    totalOrders,
    pendingCod,
    onlinePaid,
  };
}

export async function storeSalesChart(days = 30) {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const agg = await WebsiteOrder.aggregate([
      {
        $match: {
          paymentStatus: { $in: ['paid', 'cod_pending'] },
          status: { $ne: 'CANCELLED' },
          placedAt: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    ]);
    data.push({
      name: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      value: agg[0]?.revenue || 0,
      orders: agg[0]?.orders || 0,
    });
  }
  return data;
}

export async function topStoreProducts(limit = 10) {
  const rows = await WebsiteOrder.aggregate([
    { $match: { paymentStatus: { $in: ['paid', 'cod_pending'] }, status: { $ne: 'CANCELLED' } } },
    { $unwind: '$lineItems' },
    {
      $group: {
        _id: '$lineItems.productId',
        name: { $first: '$lineItems.name' },
        units: { $sum: '$lineItems.quantity' },
        revenue: { $sum: '$lineItems.amount' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({
    productId: r._id,
    name: r.name,
    units: r.units,
    revenue: r.revenue,
  }));
}
