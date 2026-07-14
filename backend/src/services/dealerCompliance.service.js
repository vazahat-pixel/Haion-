import Dealer from '../models/Dealer.model.js';

export async function assertDealerCanTransact(dealerId) {
  const dealer = await Dealer.findById(dealerId).lean();
  if (!dealer) {
    throw Object.assign(new Error('Dealer not found'), { statusCode: 404 });
  }
  if (dealer.status === 'SUSPENDED') {
    throw Object.assign(new Error('Dealer account is suspended — transactions blocked'), { statusCode: 403 });
  }
  if (dealer.status === 'PENDING_ONBOARDING') {
    throw Object.assign(new Error('Dealer onboarding is incomplete — activate dealer before billing'), { statusCode: 403 });
  }
  if (dealer.gstExpiryDate && new Date(dealer.gstExpiryDate) < new Date()) {
    throw Object.assign(
      new Error('Dealer GST certificate has expired — billing and dispatch restricted'),
      { statusCode: 403, code: 'GST_EXPIRED' }
    );
  }
  return dealer;
}

export function isGstExpired(dealer) {
  return dealer?.gstExpiryDate && new Date(dealer.gstExpiryDate) < new Date();
}
