import { Link } from 'react-router-dom';
import { AlertCircle, Database, Link2, ShieldCheck, Target, Users, Recycle, Coins } from 'lucide-react';
import { usePublicStats } from './Home';
import { CategoryPie } from '../../components/charts';
import { Card, CardHeader, DemoBadge, fmtNum } from '../../components/ui';

function Hero({ eyebrow, title, text }) {
  return (
    <section className="bg-gradient-to-b from-mint/70 to-white">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-8 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-extrabold text-forest sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">{text}</p>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <Hero eyebrow="About EcoChain" title="Incentives and transparency for cleaner cities" text="EcoChain is a KCA University project that explores how blockchain can make community recycling more rewarding and more accountable." />
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-7">
            <Target className="h-7 w-7 text-emerald" />
            <h2 className="mt-4 text-xl font-bold">The problem</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {['Low participation in recycling', 'Weak incentives for responsible disposal', 'Little transparency in how rewards are given', 'Difficulty tracking verified contributions', 'Limited accountability in community waste management'].map((t) => <li key={t}>• {t}</li>)}
            </ul>
          </Card>
          <Card className="p-7">
            <ShieldCheck className="h-7 w-7 text-emerald" />
            <h2 className="mt-4 text-xl font-bold">Our approach</h2>
            <p className="mt-3 text-sm text-muted">Citizens submit recycling. Administrators verify it. A smart contract on the Sepolia test network issues ECO tokens exactly once per verified submission, leaving a public, tamper-resistant record.</p>
          </Card>
        </div>

        <h2 className="mt-14 text-2xl font-bold">Supporting SDG 11</h2>
        <p className="mt-3 text-muted">UN Sustainable Development Goal 11 aims to make cities and human settlements inclusive, safe, resilient and sustainable. Better waste management and higher recycling participation contribute directly to cleaner, healthier communities.</p>

        <h2 className="mt-14 text-2xl font-bold">What blockchain does, and does not, do</h2>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <Link2 className="h-6 w-6 text-emerald" />
            <h3 className="mt-3 font-semibold">On the blockchain</h3>
            <p className="mt-2 text-sm text-muted">ECO token ownership, reward issuance, duplicate prevention, and public reward events.</p>
          </Card>
          <Card className="p-6">
            <Database className="h-6 w-6 text-emerald" />
            <h3 className="mt-3 font-semibold">In a normal database</h3>
            <p className="mt-2 text-sm text-muted">Accounts, passwords, evidence photos and personal details. Private data is never stored on a public chain.</p>
          </Card>
        </div>
        <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Limitation:</strong> a blockchain cannot confirm that recycling physically happened. Administrators remain a trusted verification step; the chain guarantees what happens after approval.</p>
        </div>
      </section>
    </>
  );
}

export function HowItWorks() {
  const citizen = [
    ['Create an account', 'Register with your email. Choose a display name for the leaderboard.'],
    ['Link MetaMask', 'Connect your wallet and sign a free message to prove you own it. No seed phrase, ever.'],
    ['Submit recycling', 'Pick the category, enter the weight, location and date, and add an optional photo.'],
    ['Wait for verification', 'Track your submission: Pending, Approved or Rejected (with a reason).'],
    ['Receive ECO tokens', 'Approved activities earn tokens in your wallet, with a transaction hash to prove it.'],
  ];
  const admin = [
    ['Review the queue', 'Open each submission, inspect the evidence and the citizen’s details.'],
    ['Approve or reject', 'Rejections require a reason that the citizen can read.'],
    ['Authorise the reward', 'Sign the reward transaction in your own MetaMask. The server holds no private keys.'],
    ['Smart contract checks', 'The contract confirms you are authorised and that the submission was never rewarded before.'],
    ['Record confirmed', 'The server verifies the transaction receipt on-chain, then updates the citizen’s dashboard.'],
  ];
  const Col = ({ title, items, icon: Icon }) => (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><Icon className="h-5 w-5 text-emerald" />{title}</span>} />
      <ol className="space-y-5 p-6">
        {items.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-white">{i + 1}</span>
            <div><p className="font-semibold">{t}</p><p className="text-sm text-muted">{d}</p></div>
          </li>
        ))}
      </ol>
    </Card>
  );
  return (
    <>
      <Hero eyebrow="How it works" title="From recycling bin to blockchain" text="A simple verified flow for citizens, and a secure approval process for administrators." />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-8 lg:grid-cols-2">
        <Col title="For citizens" items={citizen} icon={Users} />
        <Col title="For administrators" items={admin} icon={ShieldCheck} />
      </section>
      <section className="mx-auto max-w-3xl px-4 pb-16 text-center sm:px-8">
        <Link to="/register" className="btn btn-primary px-7 py-3 text-base">Get started</Link>
      </section>
    </>
  );
}

export function Impact() {
  const stats = usePublicStats();
  return (
    <>
      <Hero eyebrow="Our impact" title="Real numbers, honestly labelled" text="These figures are calculated live from verified recycling records on this platform." />
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-8">
        {stats?.containsDemoData && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-muted">
            <DemoBadge /> This installation contains seeded demonstration accounts. Their records are included in the totals below for presentation purposes and are not real environmental achievements.
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-3">
          {[[Users, 'Registered citizens', stats && fmtNum(stats.citizens, 0)],
            [Recycle, 'Verified waste (kg)', stats && fmtNum(stats.verifiedKg, 1)],
            [Coins, 'ECO confirmed on-chain', stats && fmtNum(stats.tokensDistributed, 1)]].map(([Icon, l, v]) => (
            <Card key={l} className="p-6 text-center">
              <Icon className="mx-auto h-7 w-7 text-emerald" />
              <p className="mt-3 text-3xl font-extrabold text-forest">{v ?? '·'}</p>
              <p className="text-sm text-muted">{l}</p>
            </Card>
          ))}
        </div>
        {stats?.containsDemoData && (
          <p className="mt-3 text-center text-xs text-muted">Of the verified waste: {fmtNum(stats.realVerifiedKg, 1)} kg from real accounts, {fmtNum(stats.demoVerifiedKg, 1)} kg from demo accounts.</p>
        )}
        <Card className="mt-8">
          <CardHeader title="Verified waste by category" />
          <div className="p-5">
            {stats && stats.categories.some((c) => c.verifiedKg > 0) ? <CategoryPie data={stats.categories} /> : <p className="py-10 text-center text-sm text-muted">No verified recycling yet. Be the first!</p>}
          </div>
        </Card>
      </section>
    </>
  );
}
