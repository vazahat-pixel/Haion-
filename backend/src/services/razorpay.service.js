import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';

let instance;

export function getRazorpay() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) return null;
  if (!instance) {
    instance = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return instance;
}

export function isRazorpayConfigured() {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (!env.razorpayKeySecret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', env.razorpayKeySecret).update(body).digest('hex');
  return expected === signature;
}

export async function createRazorpayOrder({ amountPaise, receipt, notes = {} }) {
  const razorpay = getRazorpay();
  if (!razorpay) {
    const err = new Error('Razorpay is not configured');
    err.statusCode = 503;
    throw err;
  }
  try {
    return await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: String(receipt).slice(0, 40),
      notes,
    });
  } catch (error) {
    const msg = error?.error?.description || error?.message || '';
    if (/maximum amount/i.test(msg)) {
      const err = new Error(
        'Razorpay test account limit exceeded. Use Cash on Delivery, lower the product price in CMS for testing, or set RAZORPAY_DEV_TEST_AMOUNT=100 in backend .env (dev only).'
      );
      err.statusCode = 400;
      throw err;
    }
    throw error;
  }
}
