import React from 'react';
import PremiumLoginPage from '@/pages/auth/PremiumLoginPage';

/**
 * The customer-facing login at /customer/login.
 *
 * `lockPortal` hides the Enterprise Portal switcher: buyers reach this screen
 * from the mobile app and marketing links, and should never be shown the staff
 * ERP login. Staff sign in at /auth/login instead.
 */
export default function CustomerLoginPage() {
  return <PremiumLoginPage initialPortal="customer" lockPortal />;
}
