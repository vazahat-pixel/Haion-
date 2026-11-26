import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Headphones, Wrench, Warehouse, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { crm } from './api';
import { BRAND } from '../api';
import '../dms.css';
import '../dms-modern.css';

const STEPS = [
  [Headphones, 'Call Centre books the complaint'],
  [Wrench, 'Service centre repairs it'],
  [Warehouse, 'Warehouse ships the spare parts'],
  [ShieldCheck, 'Claims and ledgers stay in sync'],
];

export default function ServiceLogin() {
  const { login, logout, isAuthenticated, isInitializing } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const from = location.state?.from?.pathname;
  const target = from && from.startsWith('/distributor/service') && !from.startsWith('/distributor/service/login') ? from : '/distributor/service/home';

  useEffect(() => {
    const prev = document.title;
    document.title = 'Sign In | Service CRM';
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
      await crm.get('/me');
      nav(target, { replace: true });
    } catch (err) {
      const msg = err?.response?.status === 403 ? (err?.response?.data?.message || 'This account does not have access to the Service panel.') : (err?.response?.data?.message || 'Could not open the Service panel.');
      await logout().catch(() => {});
      setError(msg);
      setBusy(false);
    }
  };

  return (
    <div className="dms-login">
      <div className="dms-login-art">
        <p>Complaints, repairs and spare parts in one place.</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '26px 0 0', display: 'grid', gap: 14 }}>
          {STEPS.map(([Icon, text], i) => (
            <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#dbe5ff', fontSize: 15, animation: `dmsRow .5s ${0.1 + i * 0.12}s both` }}>
              <span style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.12)' }}><Icon size={19} /></span>{text}
            </li>
          ))}
        </ul>
      </div>
      <div className="dms-login-side">
        <form className="dms-login-box" onSubmit={submit} noValidate>
          <div className="dms-login-logo"><b>{BRAND.name}<span>CRM</span></b></div>
          <h1>Sign in to continue to Service CRM</h1>
          {error && <div className="dms-alert" role="alert">{error}</div>}
          <label className="dms-label" htmlFor="crm-user">USER ID <span className="req">*</span></label>
          <input id="crm-user" className="dms-input" autoComplete="username" autoFocus value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Login ID (e.g. PY0003)" />
          <label className="dms-label" htmlFor="crm-pass">PASSWORD <span className="req">*</span></label>
          <input id="crm-pass" className="dms-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="dms-btn dms-login-btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
          <p style={{ marginTop: 14, textAlign: 'center', fontSize: 12.5 }}><a href="/distributor/login">Distributor (DMS) sign in</a></p>
        </form>
        <footer className="dms-login-foot">{BRAND.footer}</footer>
      </div>
    </div>
  );
}
