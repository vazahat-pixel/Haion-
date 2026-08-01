import crypto from 'crypto';
import Customer from '../models/Customer.model.js';
import ReferralBonus from '../models/ReferralBonus.model.js';
import ReferralWithdrawal from '../models/ReferralWithdrawal.model.js';

// ── Generate unique referral code ────────────────────────────────────────────
export function generateReferralCode(customerId) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'EV20-';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// ── Ensure referral code exists on customer (called on first bill) ────────────
export async function ensureReferralCode(customer, session = null) {
  if (customer.referralCode) return customer.referralCode;

  let code;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = generateReferralCode(customer._id);
    const existing = await Customer.findOne({ referralCode: code }).lean();
    if (!existing) isUnique = true;
    attempts++;
  }

  if (!isUnique) throw new Error('Could not generate unique referral code');

  const opts = session ? { session } : {};
  await Customer.findByIdAndUpdate(customer._id, { referralCode: code }, opts);

  // Create ReferralBonus record for this customer
  const exists = await ReferralBonus.findOne({ customer: customer._id }).lean();
  if (!exists) {
    await ReferralBonus.create([{
      customer: customer._id,
      dealer: customer.dealer,
      referralCode: code,
      status: 'PENDING',
    }], opts);
  }

  return code;
}

// ── Apply referral code on a bill (when a new customer buys using someone's code) ──
export async function applyReferralCode({ referralCode, newCustomer, bill, session = null }) {
  if (!referralCode) return null;

  const code = referralCode.toUpperCase().trim();

  // Find the referrer (owner of the code)
  const referrer = await Customer.findOne({ referralCode: code }).lean();
  if (!referrer) return { error: 'Invalid referral code' };

  // Cannot refer yourself
  if (String(referrer._id) === String(newCustomer._id)) return { error: 'Cannot use your own referral code' };

  // Find the referrer's bonus record
  let bonus = await ReferralBonus.findOne({ customer: referrer._id });
  if (!bonus) return { error: 'Referrer has no active bonus record' };

  // Check if this customer was already counted for this referrer
  const alreadyCounted = bonus.referredCustomers.some(
    (rc) => String(rc.customer) === String(newCustomer._id)
  );
  if (alreadyCounted) return { error: 'Customer already counted for this referral' };

  // Max 2 referrals allowed to activate bonus
  if (bonus.referredCustomers.length >= 2) return { error: 'Referral limit already reached' };

  // Mark new customer as referred by this referrer
  const opts = session ? { session } : {};
  await Customer.findByIdAndUpdate(newCustomer._id, { referredBy: referrer._id }, opts);

  // Add to referredCustomers list
  bonus.referredCustomers.push({
    customer: newCustomer._id,
    bill: bill._id,
    activatedAt: new Date(),
  });

  // If 2 referrals complete → ACTIVATE bonus & create Month 1 withdrawal!
  if (bonus.referredCustomers.length >= 2 && bonus.status === 'PENDING') {
    bonus.status = 'ACTIVE';
    bonus.activatedAt = new Date();
    bonus.currentMonth = 1;
    const nextMonth = new Date();
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setHours(0, 0, 0, 0);
    bonus.nextWithdrawalDue = nextMonth;

    // Create Month 1 pending withdrawal so customer can request it immediately
    const existingWd = await ReferralWithdrawal.findOne({ referralBonus: bonus._id, month: 1 });
    if (!existingWd) {
      await ReferralWithdrawal.create({
        referralBonus: bonus._id,
        customer: referrer._id,
        dealer: bonus.dealer,
        month: 1,
        amount: bonus.monthlyLimit || 2500,
        status: 'PENDING',
        bankAccountNo: referrer.bankAccountNo || '',
        bankIFSC: referrer.bankIFSC || '',
        bankName: referrer.bankName || '',
        bankAccountHolder: referrer.bankAccountHolder || '',
        withdrawalRef: `WD-${bonus.referralCode}-M01`,
      });
    }
  }

  await bonus.save(session ? { session } : {});

  return { bonus, referrer };
}

// ── Get referral summary for a customer ──────────────────────────────────────
export async function getCustomerReferralSummary(customerId) {
  const bonus = await ReferralBonus.findOne({ customer: customerId })
    .populate('referredCustomers.customer', 'name phone code')
    .lean();

  const withdrawals = bonus
    ? await ReferralWithdrawal.find({ referralBonus: bonus._id }).sort({ month: 1 }).lean()
    : [];

  return { bonus, withdrawals };
}

// ── Process monthly withdrawal release (called by cron job) ─────────────────
export async function processMonthlyWithdrawals() {
  const now = new Date();
  const processed = [];

  // Find all ACTIVE bonuses where withdrawal is due
  const activeBonuses = await ReferralBonus.find({
    status: 'ACTIVE',
    nextWithdrawalDue: { $lte: now },
    currentMonth: { $lt: 16 },
  }).populate('customer', 'bankAccountNo bankIFSC bankName bankAccountHolder');

  for (const bonus of activeBonuses) {
    try {
      const nextMonth = bonus.currentMonth + 1;

      // Check if already created for this month (idempotent)
      const existing = await ReferralWithdrawal.findOne({
        referralBonus: bonus._id,
        month: nextMonth,
      });
      if (existing) continue;

      const customer = bonus.customer;
      const withdrawalRef = `WD-${bonus.referralCode}-M${String(nextMonth).padStart(2, '0')}`;

      await ReferralWithdrawal.create({
        referralBonus: bonus._id,
        customer: customer._id || customer,
        dealer: bonus.dealer,
        month: nextMonth,
        amount: bonus.monthlyLimit,
        status: 'PENDING',
        bankAccountNo: customer.bankAccountNo || '',
        bankIFSC: customer.bankIFSC || '',
        bankName: customer.bankName || '',
        bankAccountHolder: customer.bankAccountHolder || '',
        withdrawalRef,
      });

      // ── NOTE: totalWithdrawn is NOT incremented here ─────────────────────
      // It is only updated when admin explicitly marks the withdrawal as PAID.
      // This ensures customer balance = actually paid amount, not just requested.

      // Advance the month counter + set next due date
      bonus.currentMonth = nextMonth;

      const next = new Date(bonus.nextWithdrawalDue || now);
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);

      if (nextMonth >= bonus.totalMonths) {
        // All months released — but status stays ACTIVE until all are PAID
        bonus.nextWithdrawalDue = null;
      } else {
        bonus.nextWithdrawalDue = next;
      }

      await bonus.save();
      processed.push({ referralCode: bonus.referralCode, month: nextMonth });
    } catch (err) {
      console.error(`[Referral] Failed to process bonus ${bonus._id}:`, err.message);
    }
  }

  return processed;
}
