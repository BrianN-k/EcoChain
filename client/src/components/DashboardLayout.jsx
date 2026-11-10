import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, LogOut, Menu, X, Wallet, AlertTriangle } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useWallet, shortAddr } from '../context/WalletContext';
import api from '../api/client';
import { fmtDate } from './ui';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const ref = useRef(null);

  const load = () => api.get('/users/me/notifications').then((r) => setData(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggle = async () => {
    setOpen(!open);
    if (!open && data.unread > 0) {
      await api.post('/users/me/notifications/read').catch(() => {});
      setTimeout(load, 1500);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} aria-label="Notifications" className="relative rounded-xl p-2 text-muted hover:bg-slate-100">
        <Bell className="h-5 w-5" />
        {data.unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-bold text-white">{data.unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-fadeUp overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lift">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {data.notifications.length === 0 && <p className="p-6 text-center text-sm text-muted">You are all caught up.</p>}
            {data.notifications.map((n) => (
              <div key={n.id} className={`border-b border-slate-50 px-4 py-3 ${n.isRead ? '' : 'bg-mint/40'}`}>
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                <p className="mt-1 text-[11px] text-slate-400">{fmtDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletChip() {
  const { account, isSepolia, hasMetaMask } = useWallet();
  const state = !hasMetaMask ? 'No MetaMask' : !account ? 'Not connected' : !isSepolia ? 'Wrong network' : shortAddr(account);
  const ok = account && isSepolia;
  return (
    <Link to="/app/wallet" className={`hidden items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold sm:inline-flex ${ok ? 'border-emerald/30 bg-mint text-forest' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
      {ok ? <Wallet className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {state}
    </Link>
  );
}

export default function DashboardLayout({ nav, title, showWallet = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const initials = user.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const doLogout = () => { logout(); navigate('/'); };

  const sidebar = (
    <div className="flex h-full flex-col bg-forest text-white">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo light />
        <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <p className="px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-200/60">{title}</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-emerald-100/80 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="h-[18px] w-[18px]" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-emerald-100/80 hover:bg-white/10 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85%] animate-slideIn">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-100 bg-white/85 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 text-muted hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="hidden sm:block">
              <p className="text-xs text-muted">Welcome back,</p>
              <p className="-mt-0.5 text-sm font-semibold">{user.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {showWallet && <WalletChip />}
            <NotificationBell />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-forest text-xs font-bold text-white" title={user.fullName}>{initials}</div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
