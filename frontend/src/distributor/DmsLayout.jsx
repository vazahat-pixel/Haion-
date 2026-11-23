import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Power, Menu as MenuIcon } from 'lucide-react';
import { RouteErrorBoundary } from '@/components/error-boundaries/RouteErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { useMe, BRAND } from './api';
import { filterMenu } from './menu';
import 'font-awesome/css/font-awesome.min.css'; // the reference uses Font Awesome 4 icons
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import './dms.css';
import './dms-modern.css';

/* Page code is fetched while the browser is idle, so opening a menu item never waits for a download. */
const PAGE_CHUNKS = import.meta.glob('./pages/*Pages.jsx');
function preloadPages() { Object.values(PAGE_CHUNKS).forEach((load) => load().catch(() => {})); }

/** Shows "3 of 5 required" and a progress line on the action bar of the form being filled. */
function useFormProgress(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    let raf = 0;
    const run = () => {
      raf = 0;
      root.querySelectorAll('form').forEach((form) => {
        const bar = form.querySelector(':scope > .dms-actions');
        if (!bar) return;
        const req = [...form.querySelectorAll(':required')];
        const done = req.filter((e) => (e.type === 'file' ? e.files.length : e.value)).length;
        const text = !req.length ? '' : done === req.length ? 'All required fields filled' : `${done} of ${req.length} required filled`;
        if (bar.dataset.done !== text) bar.dataset.done = text;
        bar.style.setProperty('--p', req.length ? done / req.length : 0);
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(run); };
    const mo = new MutationObserver(queue);
    mo.observe(root, { childList: true, subtree: true });
    root.addEventListener('input', queue); root.addEventListener('change', queue);
    queue();
    return () => { mo.disconnect(); cancelAnimationFrame(raf); root.removeEventListener('input', queue); root.removeEventListener('change', queue); };
  });
}

/** Thin line at the top while data is loading or saving. */
function Progress() {
  const busy = useIsFetching() + useIsMutating() > 0;
  return <div className={`dms-progress ${busy ? 'on' : ''}`} aria-hidden="true" />;
}
const Skeleton = () => <div className="dms-loading dms-skel" role="status"><i /><i /><i />Loading…</div>;

/** Font Awesome 4 icon when the menu entry names one (reference look), otherwise the fallback SVG icon. */
function SideIcon({ entry, sub }) {
  if (entry.icon && !sub) { const Svg = entry.icon; return <Svg className="dms-ico" strokeWidth={1.8} aria-hidden="true" />; }
  if (entry.fa) return <i className={`fa ${entry.fa} dms-fa ${sub ? 'sub' : ''}`} aria-hidden="true" style={sub ? undefined : { color: entry.color }} />;
  return null;
}

const longDate = () => {
  const d = new Date();
  const day = d.getDate();
  const suf = [11, 12, 13].includes(day % 100) ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] || 'th';
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${d.toLocaleDateString('en-US', { month: 'long' })} ${day}${suf} ${d.getFullYear()}`;
};

export default function DmsLayout() {
  const { data: meRes, isLoading, error } = useMe();
  const me = meRes?.data;
  const { logout } = useAuth();
  const nav = useNavigate();
  const mainRef = useRef(null);
  useFormProgress(mainRef);
  const loc = useLocation();
  const [open, setOpen] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const menu = useMemo(() => filterMenu(me?.pages, me?.isAdmin), [me]);

  // open the group containing the current route
  useEffect(() => {
    const g = menu.find((x) => x.items?.some((i) => loc.pathname.startsWith(i.to)));
    if (g) setOpen(g.label);
    setDrawer(false);
  }, [loc.pathname, menu]);

  useEffect(() => {
    if (window.requestIdleCallback) { const id = window.requestIdleCallback(preloadPages, { timeout: 4000 }); return () => window.cancelIdleCallback(id); }
    const t = setTimeout(preloadPages, 1500);
    return () => clearTimeout(t);
  }, []);

  const doLogout = async () => { await logout(); nav('/distributor/login', { replace: true }); };

  if (isLoading) return <div className="dms"><div className="dms-loading">Loading…</div></div>;
  if (error) {
    return (
      <div className="dms"><div className="dms-loading">
        <p>{error?.response?.data?.message || 'Unable to open the Distributor panel.'}</p>
        <button type="button" className="dms-btn" onClick={doLogout}>Sign in with another account</button>
      </div></div>
    );
  }

  return (
    <div className={`dms ${drawer ? 'nav-open' : ''}`}>
      <Progress />
      <button type="button" className="dms-btn dms-burger" aria-label="Open menu" onClick={() => setDrawer((d) => !d)}><MenuIcon size={16} /></button>
      <div className="dms-body">
        <aside className="dms-side" aria-label="Distributor navigation">
          <div className="dms-logo"><b>{BRAND.name}<span>{BRAND.accent}</span></b></div>
          <div className="dms-user">
            <div>{me.displayName} ({me.loginId})</div>
            <div className="dms-date">{longDate()} <button type="button" onClick={doLogout} title="Logout" aria-label="Logout"><Power size={13} /></button></div>
          </div>
          <ul className="dms-menu">
            {menu.map((g) => {
              if (!g.items) {
                return (
                  <li key={g.label}>
                    <NavLink to={g.to} className={({ isActive }) => `dms-mi ${isActive ? 'active' : ''}`}>
                      <SideIcon entry={g} />{g.label}
                    </NavLink>
                  </li>
                );
              }
              const isOpen = open === g.label;
              return (
                <li key={g.label} className={isOpen ? 'open' : ''}>
                  <button type="button" className="dms-mi" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : g.label)}>
                    <SideIcon entry={g} />{g.label}<ChevronDown size={15} className="chev" />
                  </button>
                  <div className="dms-sub-wrap">
                    <ul className="dms-sub">
                      {g.items.map((i) => (
                        <li key={i.to}><NavLink to={i.to} className={({ isActive }) => (isActive ? 'active' : '')}><SideIcon entry={i} sub />{i.label}</NavLink></li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
            <li>
              <button type="button" className="dms-mi" onClick={doLogout}><Power className="dms-ico" />Logout</button>
            </li>
          </ul>
        </aside>
        <main className="dms-main" ref={mainRef}>
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
