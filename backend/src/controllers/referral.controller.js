import Customer from '../models/Customer.model.js';
import ReferralBonus from '../models/ReferralBonus.model.js';
import ReferralWithdrawal from '../models/ReferralWithdrawal.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
import { parsePagination } from '../utils/pagination.util.js';
import { getCustomerReferralSummary } from '../services/referral.service.js';
import { resolveCustomerProfile } from './customerPanel.controller.js';

// ── Map referral bonus for API response ──────────────────────────────────────
function mapBonus(bonus, withdrawals = []) {
  if (!bonus) return null;
  const paidWithdrawals = withdrawals.filter((w) => w.status === 'PAID');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING');
  return {
    id: String(bonus._id),
    referralCode: bonus.referralCode,
    status: bonus.status,
    bonusAmount: bonus.bonusAmount,
    monthlyLimit: bonus.monthlyLimit,
    totalMonths: bonus.totalMonths,
    totalWithdrawn: bonus.totalWithdrawn,
    currentMonth: bonus.currentMonth,
    remainingBalance: Math.max(0, bonus.bonusAmount - bonus.totalWithdrawn),
    referredCount: bonus.referredCustomers?.length ?? 0,
    referredCustomers: (bonus.referredCustomers || []).map((rc) => ({
      name: rc.customer?.name || 'Customer',
      phone: rc.customer?.phone || '',
      code: rc.customer?.code || '',
      activatedAt: rc.activatedAt,
    })),
    activatedAt: bonus.activatedAt,
    completedAt: bonus.completedAt,
    nextWithdrawalDue: bonus.nextWithdrawalDue,
    createdAt: bonus.createdAt,
    withdrawals: withdrawals.map(mapWithdrawal),
    stats: {
      totalPaid: paidWithdrawals.reduce((s, w) => s + w.amount, 0),
      pendingAmount: pendingWithdrawals.reduce((s, w) => s + w.amount, 0),
      paidMonths: paidWithdrawals.length,
      pendingMonths: pendingWithdrawals.length,
    },
  };
}

function mapWithdrawal(w) {
  return {
    id: String(w._id),
    month: w.month,
    amount: w.amount,
    status: w.status,
    withdrawalRef: w.withdrawalRef,
    bankName: w.bankName,
    bankAccountHolder: w.bankAccountHolder,
    processedAt: w.processedAt,
    adminNote: w.adminNote,
    createdAt: w.createdAt,
  };
}

// ── CUSTOMER: Get my referral bonus + code ───────────────────────────────────
export const getMyReferralBonus = asyncHandler(async (req, res) => {
  const profile = await resolveCustomerProfile({ user: req.user });
  if (!profile) return sendError(res, { message: 'Customer profile not found', statusCode: 404 });

  const { bonus, withdrawals } = await getCustomerReferralSummary(profile._id);
  return sendSuccess(res, {
    data: {
      referralCode: profile.referralCode || null,
      bonus: mapBonus(bonus, withdrawals),
    },
  });
});

// ── CUSTOMER: Request withdrawal of a pending monthly amount ──────────────────
export const customerRequestWithdrawal = asyncHandler(async (req, res) => {
  const profile = await resolveCustomerProfile({ user: req.user });
  if (!profile) return sendError(res, { message: 'Customer profile not found', statusCode: 404 });

  const bonus = await ReferralBonus.findOne({ customer: profile._id });
  if (!bonus) return sendError(res, { message: 'No referral bonus found', statusCode: 404 });
  if (bonus.status !== 'ACTIVE') {
    return sendError(res, {
      message: bonus.status === 'PENDING'
        ? 'Bonus not yet activated. Refer 2 customers first.'
        : 'All withdrawals completed.',
      statusCode: 400,
    });
  }

  // Find the most recent PENDING withdrawal for this customer
  const pendingWithdrawal = await ReferralWithdrawal.findOne({
    referralBonus: bonus._id,
    customer: profile._id,
    status: 'PENDING',
  }).sort({ month: 1 });

  if (!pendingWithdrawal) {
    return sendError(res, {
      message: 'No pending withdrawal available. Your next withdrawal will be released on the 1st of next month.',
      statusCode: 404,
    });
  }

  // Check bank details are filled
  if (!profile.bankAccountNo || !profile.bankIFSC) {
    return sendError(res, {
      message: 'Bank details not set. Please update your profile with bank account details first.',
      statusCode: 400,
    });
  }

  // Refresh bank details on the withdrawal record in case they were updated
  pendingWithdrawal.bankAccountNo = profile.bankAccountNo || pendingWithdrawal.bankAccountNo;
  pendingWithdrawal.bankIFSC = profile.bankIFSC || pendingWithdrawal.bankIFSC;
  pendingWithdrawal.bankName = profile.bankName || pendingWithdrawal.bankName;
  pendingWithdrawal.bankAccountHolder = profile.bankAccountHolder || pendingWithdrawal.bankAccountHolder;
  await pendingWithdrawal.save();

  return sendSuccess(res, {
    data: {
      withdrawalRef: pendingWithdrawal.withdrawalRef,
      amount: pendingWithdrawal.amount,
      month: pendingWithdrawal.month,
      status: pendingWithdrawal.status,
      bankName: pendingWithdrawal.bankName,
      bankIFSC: pendingWithdrawal.bankIFSC,
      bankAccountHolder: pendingWithdrawal.bankAccountHolder,
    },
    message: `Withdrawal request sent to admin. ₹${pendingWithdrawal.amount.toLocaleString('en-IN')} will be transferred to your bank account.`,
  });
});


// ── ADMIN: List all referral bonuses ─────────────────────────────────────────
export const adminListReferralBonuses = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dealerId) filter.dealer = req.query.dealerId;

  const [rows, total] = await Promise.all([
    ReferralBonus.find(filter)
      .populate('customer', 'name phone code referralCode')
      .populate('dealer', 'name')
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .lean(),
    ReferralBonus.countDocuments(filter),
  ]);

  return sendPaginated(res, {
    data: rows.map((b) => ({
      id: String(b._id),
      referralCode: b.referralCode,
      customerName: b.customer?.name || '',
      customerCode: b.customer?.code || '',
      customerPhone: b.customer?.phone || '',
      dealerName: b.dealer?.name || '',
      status: b.status,
      bonusAmount: b.bonusAmount,
      totalWithdrawn: b.totalWithdrawn,
      remainingBalance: Math.max(0, b.bonusAmount - b.totalWithdrawn),
      referredCount: b.referredCustomers?.length ?? 0,
      currentMonth: b.currentMonth,
      totalMonths: b.totalMonths,
      activatedAt: b.activatedAt,
      nextWithdrawalDue: b.nextWithdrawalDue,
      createdAt: b.createdAt,
    })),
    total,
    page,
    perPage,
  });
});

// ── ADMIN: Get single referral bonus detail ───────────────────────────────────
export const adminGetReferralBonus = asyncHandler(async (req, res) => {
  const bonus = await ReferralBonus.findById(req.params.id)
    .populate('customer', 'name phone code referralCode bankAccountNo bankIFSC bankName bankAccountHolder')
    .populate('dealer', 'name')
    .populate('referredCustomers.customer', 'name phone code')
    .lean();

  if (!bonus) return sendError(res, { message: 'Referral bonus not found', statusCode: 404 });

  const withdrawals = await ReferralWithdrawal.find({ referralBonus: bonus._id })
    .populate('processedBy', 'firstName lastName')
    .sort({ month: 1 })
    .lean();

  return sendSuccess(res, { data: mapBonus(bonus, withdrawals) });
});

// ── ADMIN: List all withdrawal requests ──────────────────────────────────────
export const adminListWithdrawals = asyncHandler(async (req, res) => {
  const { page, perPage, skip, sort } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dealerId) filter.dealer = req.query.dealerId;

  const [rows, total] = await Promise.all([
    ReferralWithdrawal.find(filter)
      .populate('customer', 'name phone code')
      .populate('referralBonus', 'referralCode')
      .populate('processedBy', 'firstName lastName')
      .sort(sort)
      .skip(skip)
      .limit(perPage)
      .lean(),
    ReferralWithdrawal.countDocuments(filter),
  ]);

  return sendPaginated(res, {
    data: rows.map((w) => ({
      id: String(w._id),
      withdrawalRef: w.withdrawalRef,
      referralCode: w.referralBonus?.referralCode || '',
      customerName: w.customer?.name || '',
      customerCode: w.customer?.code || '',
      customerPhone: w.customer?.phone || '',
      month: w.month,
      amount: w.amount,
      status: w.status,
      bankName: w.bankName,
      bankAccountHolder: w.bankAccountHolder,
      bankIFSC: w.bankIFSC,
      bankAccountNo: w.bankAccountNo,
      processedAt: w.processedAt,
      processedBy: w.processedBy ? `${w.processedBy.firstName} ${w.processedBy.lastName}` : null,
      adminNote: w.adminNote,
      createdAt: w.createdAt,
    })),
    total,
    page,
    perPage,
  });
});

// ── ADMIN: Approve / Reject / Mark Paid a withdrawal ─────────────────────────
export const adminProcessWithdrawal = asyncHandler(async (req, res) => {
  const { action, adminNote } = req.body; // action: 'APPROVE' | 'REJECT' | 'PAID'
  if (!['APPROVE', 'REJECT', 'PAID'].includes(action)) {
    return sendError(res, { message: 'Invalid action. Use APPROVE, REJECT, or PAID', statusCode: 400 });
  }

  const withdrawal = await ReferralWithdrawal.findById(req.params.id);
  if (!withdrawal) return sendError(res, { message: 'Withdrawal not found', statusCode: 404 });

  const prevStatus = withdrawal.status;
  const statusMap = { APPROVE: 'APPROVED', REJECT: 'REJECTED', PAID: 'PAID' };
  withdrawal.status = statusMap[action];
  withdrawal.processedAt = new Date();
  withdrawal.processedBy = req.user._id;
  if (adminNote) withdrawal.adminNote = adminNote;

  await withdrawal.save();

  // ── When PAID → deduct from ReferralBonus.totalWithdrawn ──────────────────
  if (action === 'PAID' && prevStatus !== 'PAID') {
    const bonus = await ReferralBonus.findById(withdrawal.referralBonus);
    if (bonus) {
      bonus.totalWithdrawn = (bonus.totalWithdrawn || 0) + withdrawal.amount;

      // If all months are done, mark as COMPLETED
      const paidCount = await ReferralWithdrawal.countDocuments({
        referralBonus: bonus._id,
        status: 'PAID',
      });
      if (paidCount >= bonus.totalMonths) {
        bonus.status = 'COMPLETED';
        bonus.completedAt = new Date();
        bonus.nextWithdrawalDue = null;
      }
      await bonus.save();
    }
  }

  // ── When REJECT (was PENDING/APPROVED) → do nothing to totalWithdrawn ─────
  // totalWithdrawn is only updated on PAID, so no rollback needed

  return sendSuccess(res, {
    data: mapWithdrawal(withdrawal.toObject()),
    message: action === 'PAID'
      ? 'Payment marked — customer balance updated'
      : `Withdrawal ${action.toLowerCase()}d`,
  });
});


// ── ADMIN: Stats overview ─────────────────────────────────────────────────────
export const adminReferralStats = asyncHandler(async (_req, res) => {
  const [statusCounts, withdrawalStats] = await Promise.all([
    ReferralBonus.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    ReferralWithdrawal.aggregate([
      { $group: { _id: '$status', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  const bonusStats = { PENDING: 0, ACTIVE: 0, COMPLETED: 0 };
  statusCounts.forEach((s) => { bonusStats[s._id] = s.count; });

  const wdStats = {};
  withdrawalStats.forEach((s) => { wdStats[s._id] = { amount: s.totalAmount, count: s.count }; });

  return sendSuccess(res, {
    data: {
      bonuses: bonusStats,
      withdrawals: {
        pending: wdStats.PENDING || { amount: 0, count: 0 },
        approved: wdStats.APPROVED || { amount: 0, count: 0 },
        paid: wdStats.PAID || { amount: 0, count: 0 },
        rejected: wdStats.REJECTED || { amount: 0, count: 0 },
      },
    },
  });
});
