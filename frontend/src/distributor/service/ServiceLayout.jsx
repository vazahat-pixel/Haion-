import { Suspense, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Power, Menu as MenuIcon, LogOut } from 'lucide-react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { BRAND } from '../api';
import { useCrmMe } from './api';
import { getCrmMenu } from './menu';
import '../dms.css';
import '../dms-modern.css';

function Progress() {
  const busy = useIsFetching() + useIsMutating() > 0;
  return <div className={`dms-progress ${busy ? 'on' : ''}`} aria-hidden="true" />;
}
const Skeleton = () => <div className="dms-loading dms-skel" role="status"><i /><i /><i />Loading…</div>;

const longDate = () => {
  const d = new Date();
  const day = d.getDate();
  const suf = [11, 12, 13].includes(day % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] || 'th';
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${d.toLocaleDateString('en-US', { month: 'long' })} ${day}${suf} ${d.getFullYear()}`;
};

export default function ServiceLayout() {
  const { data: meRes, isLoading, error } = useCrmMe();
  const me = meRes?.data;
  const { logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const menu = useMemo(() => getCrmMenu(me?.crmRole), [me]);

  useEffect(() => {
    const g = menu.find((x) => x.items?.some((i) => loc.pathname.startsWith(i.to)));
    if (g) setOpen(g.label);
    setDrawer(false);
  }, [loc.pathname, menu]);

  const doLogout = async () => { await logout(); nav('/distributor/service/login', { replace: true }); };

  if (isLoading) return <div className="dms"><div className="dms-loading">Loading…</div></div>;
  if (error) {
    return (
      <div className="dms"><div className="dms-loading">
        <p>{error?.response?.data?.message || 'Unable to open the Service panel.'}</p>
        <button type="button" className="dms-btn" onClick={doLogout}>Sign in with another account</button>
      </div></div>
    );
  }

  return (
    <div className={`dms ${drawer ? 'nav-open' : ''}`}>
      <Progress />
      <button type="button" className="dms-btn dms-burger" aria-label="Open menu" onClick={() => setDrawer((d) => !d)}><MenuIcon size={16} /></button>
      <div className="dms-body">
        <aside className="dms-side" aria-label="Service navigation">
          <div className="dms-logo"><b>{BRAND.name}<span>CRM</span></b></div>
          <div className="dms-user">
            <div>Welcome {me.displayName} ({me.loginId})</div>
            <div className="dms-date">{longDate()} <button type="button" onClick={doLogout} title="Logout" aria-label="Logout"><Power size={13} /></button></div>
          </div>
          <ul className="dms-menu">
            {menu.map((g) => {
              const Icon = g.icon;
              if (!g.items) {
                return (
                  <li key={g.label}>
                    <NavLink to={g.to} className={({ isActive }) => `dms-mi ${isActive ? 'active' : ''}`}>
                      {Icon && <Icon className="dms-ico" strokeWidth={1.8} aria-hidden="true" />}{g.label}
                    </NavLink>
                  </li>
                );
              }
              const isOpen = open === g.label;
              return (
                <li key={g.label} className={isOpen ? 'open' : ''}>
                  <button type="button" className="dms-mi" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.label)}>
                    {Icon && <Icon className="dms-ico" strokeWidth={1.8} aria-hidden="true" />}{g.label}<ChevronDown size={15} className="chev" />
                  </button>
                  <div className="dms-sub-wrap">
                    <ul className="dms-sub">
                      {g.items.map((i) => (
                        <li key={i.to}><NavLink to={i.to} end className={({ isActive }) => (isActive ? 'active' : '')}>{i.label}</NavLink></li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
            <li><button type="button" className="dms-mi" onClick={doLogout}><LogOut className="dms-ico" />Logout</button></li>
          </ul>
        </aside>
        <main className="dms-main">
          <RouteErrorBoundary>
            <Suspense fallback={<Skeleton />}>
              <div className="dms-page" key={loc.pathname}><Outlet context={{ me }} /></div>
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>
      <footer className="dms-footer">{BRAND.footer}</footer>
    </div>
  );
}
