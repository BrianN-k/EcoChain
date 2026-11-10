import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BadgeCheck, CupSoda, Coins, FileText, Link2, Lock, Recycle, ScanSearch,
  Sparkles, Users, Wine, Newspaper, Container, Eye, Wallet,
} from 'lucide-react';
import api from '../../api/client';
import { fmtNum, DemoBadge } from '../../components/ui';

export function usePublicStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/public/stats').then((r) => setStats(r.data)).catch(() => setStats(false));
  }, []);
  return stats;
}

const steps = [
  { icon: Recycle, title: 'Recycle & submit', text: 'Sort your waste, then log the category, weight, location and date. Add a photo if you have one.' },
  { icon: ScanSearch, title: 'Admin verifies', text: 'An administrator inspects your submission and evidence, then approves or rejects it with a reason.' },
  { icon: Link2, title: 'Smart contract rewards', text: 'On approval, the EcoChain smart contract mints ECO tokens to your wallet. Each submission can be rewarded only once.' },
  { icon: Eye, title: 'Track on-chain', text: 'Every reward has a transaction hash you can open on the Sepolia block explorer.' },
];

const categories = [
  { icon: CupSoda, name: 'Plastic', rate: 'PLASTIC', color: 'bg-emerald/10 text-emerald' },
  { icon: Newspaper, name: 'Paper', rate: 'PAPER', color: 'bg-sky-100 text-sky-600' },
  { icon: Wine, name: 'Glass', rate: 'GLASS', color: 'bg-violet-100 text-violet-600' },
  { icon: Container, name: 'Metal', rate: 'METAL', color: 'bg-amber-100 text-amber-600' },
];

const reasons = [
  { icon: Eye, title: 'Transparent', text: 'Anyone can check that a reward was issued, to which wallet, and for how many tokens.' },
  { icon: Lock, title: 'Tamper-resistant', text: 'Once confirmed, a reward record cannot be edited or deleted by anyone, including administrators.' },
  { icon: BadgeCheck, title: 'No double rewards', text: 'The smart contract rejects a second reward for the same submission, even if the website has a bug.' },
  { icon: Wallet, title: 'You own your tokens', text: 'ECO tokens sit in your own MetaMask wallet. EcoChain never sees your keys or seed phrase.' },
];

export default function Home() {
  const stats = usePublicStats();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-mint/70 via-white to-white">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <div className="animate-fadeUp">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-forest shadow-card ring-1 ring-emerald/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald" /> Supporting UN SDG 11 · Sustainable Cities and Communities
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] text-forest sm:text-5xl lg:text-6xl">
              Waste Less. Earn More. Build Greener Communities.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Join a smarter recycling community. Track your recycling activities, earn digital rewards, and contribute to cleaner cities through blockchain technology.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary px-6 py-3 text-base shadow-lift">Join EcoChain <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/how-it-works" className="btn btn-outline px-6 py-3 text-base">Discover How It Works</Link>
            </div>
            <p className="mt-6 text-sm font-medium text-forest">Recycle. Earn. Build a Greener Future.</p>
          </div>

          {/* Product preview card */}
          <div className="relative animate-fadeUp [animation-delay:150ms]">
            <div className="card p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted">Your ECO balance</p>
                <span className="rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-forest">Sepolia</span>
              </div>
              <p className="mt-2 text-4xl font-extrabold text-forest">248.5 <span className="text-lg text-emerald">ECO</span></p>
              <div className="mt-5 space-y-3">
                {[['Plastic · 4.2 kg', '+42.0', 'Rewarded'], ['Metal · 1.8 kg', '+21.6', 'Rewarded'], ['Paper · 3.0 kg', '+24.0', 'Pending']].map(([a, b, c]) => (
                  <div key={a} className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                    <div><p className="text-sm font-semibold">{a}</p><p className="text-xs text-muted">{c}</p></div>
                    <p className="font-bold text-emerald">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald">What is EcoChain?</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Recycling you can prove, rewards you can trust</h2>
          <p className="mt-4 text-muted">
            EcoChain connects citizens and administrators through a transparent verification process. Citizens submit recycling activities, administrators verify them, and approved activities trigger blockchain-based ECO token rewards that anyone can audit.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <h2 className="text-center text-3xl font-bold">How EcoChain works</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="card relative p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="absolute right-5 top-4 text-5xl font-extrabold text-slate-100">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-forest"><s.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Recycling categories</h2>
          <p className="mt-3 text-muted">Four materials, each with its own reward rate (ECO per kilogram).</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <div key={c.name} className="card p-6 text-center">
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${c.color}`}><c.icon className="h-7 w-7" /></span>
              <h3 className="mt-4 font-semibold">{c.name}</h3>
              <p className="mt-1 text-2xl font-extrabold text-forest">
                {stats?.rates ? stats.rates[c.rate] : '·'} <span className="text-sm font-medium text-muted">ECO / kg</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* IMPACT */}
      <section className="bg-forest py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-3 text-center">
            <h2 className="text-3xl font-bold">Environmental impact so far</h2>
            {stats?.containsDemoData && <DemoBadge />}
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              [Users, stats ? fmtNum(stats.citizens, 0) : '·', 'Registered citizens'],
              [Recycle, stats ? `${fmtNum(stats.verifiedKg, 1)} kg` : '·', 'Verified waste recycled'],
              [Coins, stats ? `${fmtNum(stats.tokensDistributed, 1)}` : '·', 'ECO tokens confirmed on-chain'],
            ].map(([Icon, v, l]) => (
              <div key={l} className="rounded-2xl bg-white/10 p-6 text-center ring-1 ring-white/15">
                <Icon className="mx-auto h-7 w-7 text-emerald-300" />
                <p className="mt-3 text-4xl font-extrabold">{v}</p>
                <p className="mt-1 text-sm text-emerald-100/80">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-emerald-100/70">
            {stats === false
              ? 'Statistics are unavailable right now.'
              : 'Figures come from this platform’s own records.'}
          </p>
        </div>
      </section>

      {/* WHY BLOCKCHAIN */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Why blockchain technology?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">Accounts, photos and review queues stay in a normal database. The blockchain is used only where public trust matters most: reward records.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((r) => (
            <div key={r.title} className="card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest"><r.icon className="h-5 w-5" /></span>
              <h3 className="mt-4 font-semibold">{r.title}</h3>
              <p className="mt-2 text-sm text-muted">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMMUNITY */}
      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">A community that recycles together</h2>
            <p className="mt-4 text-muted">A public leaderboard shows the most active recyclers using display names only. No critical details are ever shown to other citizens.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {['Rank by verified kilograms recycled', 'Private by design: choose your own display name', 'Rewards for every approved contribution'].map((t) => (
                <li key={t} className="flex items-center gap-3"><BadgeCheck className="h-5 w-5 text-emerald" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="card divide-y divide-slate-100">
            {[['1', 'Amina', '58.4 kg'], ['2', 'Brian', '44.0 kg'], ['3', 'Cynthia', '37.2 kg']].map(([r, n, k]) => (
              <div key={r} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint font-bold text-forest">{r}</span>
                <span className="flex-1 font-semibold">{n}</span>
                <span className="text-sm font-semibold text-emerald">{k}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-8">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-forest to-emerald p-10 text-center text-white sm:p-14">
          <FileText className="absolute -right-6 -top-6 h-40 w-40 rotate-12 text-white/5" />
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to turn recycling into rewards?</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-50/90">Create a free account, link your MetaMask wallet and submit your first recycling activity today.</p>
          <Link to="/register" className="btn mt-8 bg-white px-7 py-3 text-base text-forest hover:bg-mint">Join EcoChain <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </>
  );
}
