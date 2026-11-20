import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { dms, BRAND } from './api';
import './dms.css';

/**
 * Stand-alone sign-in page for the Distributor panel (/distributor/login).
 * Accepts the DMS Login ID (e.g. INUSRBRUP141), e-mail or mobile. Only accounts with Distributor access get in.
 */
export default function DmsLogin() {
  const { login, logout, isAuthenticated, isInitializing } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname;
  const target = from && from.startsWith('/distributor') && !from.startsWith('/distributor/login') ? from : '/distributor/home';

  useEffect(() => {
    const prev = document.title;
    document.title = 'Sign In | Distributor Management System';
    return () => { document.title = prev; };
  }, []);

  if (isInitializing) return <div className="dms-login"><div className="dms-login-box"><p className="dms-muted">Loading…</p></div></div>;
  if (isAuthenticated && !busy) return <Navigate to={target} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId.trim() || !password) { setError('Enter your User ID and Password.'); return; }
    setBusy(true);
    try {
      await login({ email: userId.trim(), password });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid User ID or Password.');
      setBusy(false);
      return;
    }
    try {
      await dms.get('/me'); // confirms the account has Distributor access
      nav(target, { replace: true });
    } catch (err) {
      const msg = err?.response?.status === 403 ? 'This account does not have access to the Distributor panel.' : (err?.response?.data?.message || 'Could not open the Distributor panel.');
      await logout().catch(() => {});
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div className="dms-login">
      <form className="dms-login-box" onSubmit={submit} noValidate>
        <div className="dms-login-logo"><b>{BRAND.name}<span>{BRAND.accent}</span></b></div>
        <h1>Sign in to continue to DMS</h1>
        {params.get('expired') && !error && <div className="dms-alert" role="alert">Session Expired! Please Login Again!</div>}
        {error && <div className="dms-alert" role="alert">{error}</div>}
        <label className="dms-label" htmlFor="dms-user">USER ID <span className="req">*</span></label>
        <input id="dms-user" className="dms-input" autoComplete="username" autoFocus value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Login ID / e-mail / mobile" />
        <label className="dms-label" htmlFor="dms-pass">PASSWORD <span className="req">*</span></label>
        <input id="dms-pass" className="dms-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" className="dms-btn dms-login-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
      </form>
      <footer className="dms-login-foot">{BRAND.footer}</footer>
    </div>
  );
}
