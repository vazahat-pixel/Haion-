import cron from 'node-cron';
import { processMonthlyWithdrawals } from '../services/referral.service.js';

async function runReferralWithdrawalJob() {
  console.log('[Referral Cron] Processing monthly withdrawal releases...');
  try {
    const processed = await processMonthlyWithdrawals();
    if (processed.length > 0) {
      console.log(`[Referral Cron] Created ${processed.length} withdrawal records:`, processed);
    } else {
      console.log('[Referral Cron] No withdrawals due today.');
    }
  } catch (err) {
    console.error('[Referral Cron] Error processing withdrawals:', err.message);
  }
}

export function startReferralWithdrawalScheduler() {
  // Run on 1st of every month at 9:00 AM
  cron.schedule('0 9 1 * *', runReferralWithdrawalJob);
  console.log('[Referral Cron] Withdrawal scheduler started (runs 1st of every month at 9:00 AM)');
}
