import { useCMSSettings } from '../CMSContext';
import { pickCms } from '../cms-defaults';
import {
  CAREERS_FORM_FALLBACK,
  LEAD_POPUP_FALLBACK,
  PROFILE_UI_FALLBACK,
  CART_EXTRA_FALLBACK,
  TRACKING_UI_FALLBACK,
} from '../../data/pageContentFallback';
const CHECKOUT_DEFAULTS = {
  merchantName: 'HAION EV & Appliances',
  orderIdPrefix: 'HAION-',
  orderStatus: 'In Transit',
  codLabel: 'Cash on Delivery',
  onlineLabel: 'Pay Online',
  secureCheckoutLabel: 'Secure Checkout',
  orderDetailsTitle: 'Order Details',
  totalPayableLabel: 'Total Payable',
  trackingIdLabel: 'Your Tracking ID',
  trackShipmentLabel: 'Track Shipment Status →',
  closeWindowLabel: 'Close Window',
  confirmOrderLabel: 'Confirm Order',
  makePaymentLabel: 'Make Payment with',
  paymentMethodLabel: 'Payment Method',
  selectPaymentAppLabel: 'Select Payment App',
  awaitingAuthLabel: 'Awaiting authorization...',
  orderPlacedTitle: 'Order Placed Successfully!',
  paymentVerifiedTitle: 'Payment Verified & Order Placed!',
  paymentApps: [
    { id: 'phonepe', label: 'PhonePe', icon: '🟣' },
    { id: 'gpay', label: 'Google Pay', icon: '🔵' },
    { id: 'paytm', label: 'Paytm', icon: '🌐' },
    { id: 'bhim', label: 'BHIM UPI', icon: '🇮🇳' },
  ],
  nameLabel: 'Full Name',
  phoneLabel: 'Mobile Number',
  addressLabel: 'Shipping Address',
  namePlaceholder: 'Enter your name',
  phonePlaceholder: '10-digit number',
  addressPlaceholder: 'Enter full address',
  placeOrderLabel: 'Place Order',
  processingLabel: 'Processing payment...',
  successTitle: 'Order Placed Successfully!',
  successBody: 'Your order has been confirmed. You can track it anytime from your profile.',
  trackLabel: 'Track Order',
  continueLabel: 'Continue Shopping',
};

const CART_DEFAULTS = {
  title: 'Your Cart',
  emptyTitle: 'Your cart is empty',
  emptyBody: 'Browse our premium collection and add items to your cart.',
  checkoutLabel: 'Proceed to Checkout',
  totalLabel: 'Total',
  removeLabel: 'Remove',
};

const LEAD_DEFAULTS = {
  enabled: true,
  delayMs: 2500,
  title: 'Book Your Haion EV Test Ride',
  subtitle: 'Share your details and our team will reach out within minutes.',
};

const PROFILE_DEFAULTS = {
  guestName: 'Guest Customer',
  guestPhone: '+91 98765 43210',
  guestEmail: 'haion.user@guest.com',
  memberTier: 'Gold Member',
};

const TRACKING_DEFAULTS = {
  estimatedDelivery: '2-3 Business Days',
  steps: [
    { key: 'placed', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ],
};

export function useCMSCheckoutCopy() {
  const settings = useCMSSettings();
  const c = settings.checkout ?? {};
  return {
    merchantName: pickCms(CHECKOUT_DEFAULTS.merchantName, c.merchantName),
    orderIdPrefix: pickCms(CHECKOUT_DEFAULTS.orderIdPrefix, c.orderIdPrefix),
    orderStatus: pickCms(CHECKOUT_DEFAULTS.orderStatus, c.orderStatus),
    codLabel: pickCms(CHECKOUT_DEFAULTS.codLabel, c.codLabel),
    onlineLabel: pickCms(CHECKOUT_DEFAULTS.onlineLabel, c.onlineLabel),
    paymentApps: c.paymentApps?.length ? c.paymentApps : CHECKOUT_DEFAULTS.paymentApps,
    secureCheckoutLabel: pickCms(CHECKOUT_DEFAULTS.secureCheckoutLabel, c.secureCheckoutLabel),
    orderDetailsTitle: pickCms(CHECKOUT_DEFAULTS.orderDetailsTitle, c.orderDetailsTitle),
    totalPayableLabel: pickCms(CHECKOUT_DEFAULTS.totalPayableLabel, c.totalPayableLabel),
    trackingIdLabel: pickCms(CHECKOUT_DEFAULTS.trackingIdLabel, c.trackingIdLabel),
    trackShipmentLabel: pickCms(CHECKOUT_DEFAULTS.trackShipmentLabel, c.trackShipmentLabel),
    closeWindowLabel: pickCms(CHECKOUT_DEFAULTS.closeWindowLabel, c.closeWindowLabel),
    confirmOrderLabel: pickCms(CHECKOUT_DEFAULTS.confirmOrderLabel, c.confirmOrderLabel),
    makePaymentLabel: pickCms(CHECKOUT_DEFAULTS.makePaymentLabel, c.makePaymentLabel),
    paymentMethodLabel: pickCms(CHECKOUT_DEFAULTS.paymentMethodLabel, c.paymentMethodLabel),
    selectPaymentAppLabel: pickCms(CHECKOUT_DEFAULTS.selectPaymentAppLabel, c.selectPaymentAppLabel),
    awaitingAuthLabel: pickCms(CHECKOUT_DEFAULTS.awaitingAuthLabel, c.awaitingAuthLabel),
    orderPlacedTitle: pickCms(CHECKOUT_DEFAULTS.orderPlacedTitle, c.orderPlacedTitle),
    paymentVerifiedTitle: pickCms(CHECKOUT_DEFAULTS.paymentVerifiedTitle, c.paymentVerifiedTitle),
    namePlaceholder: pickCms(CHECKOUT_DEFAULTS.namePlaceholder, c.namePlaceholder),
    phonePlaceholder: pickCms(CHECKOUT_DEFAULTS.phonePlaceholder, c.phonePlaceholder),
    addressPlaceholder: pickCms(CHECKOUT_DEFAULTS.addressPlaceholder, c.addressPlaceholder),
    nameLabel: pickCms(CHECKOUT_DEFAULTS.nameLabel, c.nameLabel),
    phoneLabel: pickCms(CHECKOUT_DEFAULTS.phoneLabel, c.phoneLabel),
    addressLabel: pickCms(CHECKOUT_DEFAULTS.addressLabel, c.addressLabel),
    placeOrderLabel: pickCms(CHECKOUT_DEFAULTS.placeOrderLabel, c.placeOrderLabel),
    processingLabel: pickCms(CHECKOUT_DEFAULTS.processingLabel, c.processingLabel),
    successTitle: pickCms(CHECKOUT_DEFAULTS.successTitle, c.successTitle),
    successBody: pickCms(CHECKOUT_DEFAULTS.successBody, c.successBody),
    trackLabel: pickCms(CHECKOUT_DEFAULTS.trackLabel, c.trackLabel),
    continueLabel: pickCms(CHECKOUT_DEFAULTS.continueLabel, c.continueLabel),
  };
}

export function useCMSCartCopy() {
  const settings = useCMSSettings();
  const c = settings.cart ?? {};
  return {
    title: pickCms(CART_DEFAULTS.title, c.title),
    emptyTitle: pickCms(CART_DEFAULTS.emptyTitle, c.emptyTitle),
    emptyBody: pickCms(CART_DEFAULTS.emptyBody, c.emptyBody),
    checkoutLabel: pickCms(CART_DEFAULTS.checkoutLabel, c.checkoutLabel),
    totalLabel: pickCms(CART_DEFAULTS.totalLabel, c.totalLabel),
    removeLabel: pickCms(CART_DEFAULTS.removeLabel, c.removeLabel),
  };
}

export function useCMSLeadPopupCopy() {
  const settings = useCMSSettings();
  const c = settings.leadPopup ?? {};
  return {
    enabled: c.enabled !== false,
    delayMs: c.delayMs ?? LEAD_DEFAULTS.delayMs,
    title: pickCms(LEAD_DEFAULTS.title, c.title),
    subtitle: pickCms(LEAD_DEFAULTS.subtitle, c.subtitle),
    copy: c,
  };
}

export function useCMSProfileCopy() {
  const settings = useCMSSettings();
  const c = settings.profile ?? {};
  return {
    guestName: pickCms(PROFILE_DEFAULTS.guestName, c.guestName),
    guestPhone: pickCms(PROFILE_DEFAULTS.guestPhone, c.guestPhone),
    guestEmail: pickCms(PROFILE_DEFAULTS.guestEmail, c.guestEmail),
    memberTier: pickCms(PROFILE_DEFAULTS.memberTier, c.memberTier),
  };
}

export function useCMSTrackingCopy() {
  const settings = useCMSSettings();
  const c = settings.orderTracking ?? {};
  return {
    estimatedDelivery: pickCms(TRACKING_DEFAULTS.estimatedDelivery, c.estimatedDelivery),
    steps: c.steps?.length ? c.steps : TRACKING_DEFAULTS.steps,
    ...c,
  };
}

export function useCMSCareersCopy() {
  const settings = useCMSSettings();
  const c = { ...CAREERS_FORM_FALLBACK, ...(settings.careers ?? {}) };
  return c;
}

export function useCMSProfileUiCopy() {
  const settings = useCMSSettings();
  const profile = useCMSProfileCopy();
  const c = { ...PROFILE_UI_FALLBACK, ...(settings.profileUi ?? {}) };
  return { ...profile, ...c };
}

export function useCMSLeadPopupFullCopy() {
  const settings = useCMSSettings();
  const base = useCMSLeadPopupCopy();
  const c = settings.leadPopup ?? {};
  return {
    ...base,
    ...LEAD_POPUP_FALLBACK,
    ...c,
    steps: { ...LEAD_POPUP_FALLBACK.steps, ...(c.steps ?? {}) },
    fields: { ...LEAD_POPUP_FALLBACK.fields, ...(c.fields ?? {}) },
    models: c.models?.length ? c.models : LEAD_POPUP_FALLBACK.models,
    timelineOptions: c.timelineOptions?.length ? c.timelineOptions : LEAD_POPUP_FALLBACK.timelineOptions,
    helpOptions: c.helpOptions?.length ? c.helpOptions : LEAD_POPUP_FALLBACK.helpOptions,
  };
}

export function useCMSTrackingUiCopy() {
  const settings = useCMSSettings();
  const tracking = useCMSTrackingCopy();
  const c = { ...TRACKING_UI_FALLBACK, ...(settings.trackingUi ?? {}) };
  return { ...c, ...tracking, steps: c.steps?.length ? c.steps : tracking.steps };
}

export function useCMSCartFullCopy() {
  const cart = useCMSCartCopy();
  const settings = useCMSSettings();
  const extra = { ...CART_EXTRA_FALLBACK, ...(settings.cart ?? {}) };
  return { ...cart, ...extra };
}
