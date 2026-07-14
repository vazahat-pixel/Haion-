import { storePublicService } from '@/services/store.service';
import { env } from '@/config/env';

function parsePrice(value) {
  if (typeof value === 'number') return value;
  return parseInt(String(value).replace(/[^\d]/g, ''), 10) || 0;
}

export function cartItemsToLineItems(cartItems) {
  return cartItems.map((item) => ({
    productId: item.id,
    quantity: item.quantity || 1,
    color: item.color || '',
    image: item.image || '',
  }));
}

export function singleProductToLineItems(product, quantity = 1, color = '') {
  return [
    {
      productId: product.id,
      quantity,
      color,
      image: product.images?.[0] || product.image || '',
    },
  ];
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Complete checkout — COD or Razorpay.
 * @returns {{ orderNo: string, order: object }}
 */
export async function processStoreCheckout({
  cartItems,
  customer,
  paymentMethod,
  merchantName = 'Haion',
}) {
  const lineItems = cartItemsToLineItems(cartItems);
  const payload = {
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email,
    shippingAddress: customer.address,
    lineItems,
    paymentMethod: paymentMethod === 'online' ? 'razorpay' : 'cod',
  };

  const result = await storePublicService.checkout(payload);
  const order = result.order;

  if (paymentMethod === 'cod' || !result.razorpay) {
    return { orderNo: order.orderNo, order };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Payment gateway failed to load. Please try again.');
  }

  const keyId = result.razorpay.keyId || env.razorpayKeyId;
  if (!keyId) {
    throw new Error('Online payment is not configured.');
  }

  return new Promise((resolve, reject) => {
    if (result.razorpay.testCharge) {
      console.info(
        `[Haion dev] Razorpay test charge ₹${result.razorpay.chargeAmount} (order total ₹${result.razorpay.catalogTotal})`
      );
    }
    const options = {
      key: keyId,
      amount: result.razorpay.amount,
      currency: result.razorpay.currency || 'INR',
      name: result.razorpay.merchantName || merchantName,
      description: `Order ${order.orderNo}`,
      order_id: result.razorpay.orderId,
      handler: async (response) => {
        try {
          const verified = await storePublicService.verifyPayment({
            websiteOrderId: order.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve({ orderNo: verified.order.orderNo, order: verified.order });
        } catch (err) {
          reject(err);
        }
      },
      prefill: {
        name: customer.name,
        contact: customer.phone,
        email: customer.email,
      },
      theme: { color: '#e88d01' },
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp.error?.description || 'Payment failed'));
    });
    rzp.open();
  });
}

export function calcCartTotal(cartItems) {
  return cartItems.reduce((acc, item) => acc + parsePrice(item.price) * (item.quantity || 1), 0);
}
