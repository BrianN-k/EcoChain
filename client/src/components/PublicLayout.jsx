import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../routes/guards';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/impact', label: 'Our Impact' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const linkCls = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-emerald' : 'text-muted hover:text-ink'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => <NavLink key={l.to} {...l} className={linkCls}>{l.label}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to={homeFor(user)} className="btn btn-primary">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Login</Link>
                <Link to="/register" className="btn btn-primary">Get Started</Link>
              </>
            )}
          </div>
          <button className="rounded-xl p-2 text-muted md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="animate-fadeUp border-t border-slate-100 bg-white px-4 pb-4 md:hidden">
            {links.map((l) => (
              <NavLink key={l.to} {...l} onClick={() => setOpen(false)} className={({ isActive }) => `block rounded-lg px-3 py-3 text-sm font-medium ${isActive ? 'text-emerald' : 'text-ink'}`}>{l.label}</NavLink>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <Link to={homeFor(user)} className="btn btn-primary flex-1">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline flex-1">Login</Link>
                  <Link to="/register" className="btn btn-primary flex-1">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-forest text-emerald-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm text-emerald-100/80">Recycle. Earn. Build a Greener Future. A blockchain-based recycling rewards platform supporting UN SDG 11: Sustainable Cities and Communities.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-100/80">
              {links.map((l) => <li key={l.to}><Link className="hover:text-white" to={l.to}>{l.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-emerald-100/80">
              <li><Link className="hover:text-white" to="/login">Login</Link></li>
              <li><Link className="hover:text-white" to="/register">Create account</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-emerald-100/60">
          © {new Date().getFullYear()} EcoChain · Runs on the Sepolia test network.
        </div>
      </footer>
    </div>
  );
}
