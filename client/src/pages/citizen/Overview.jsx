import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, ListChecks, Medal, Plus, Recycle, Wallet, ArrowRight, Clock } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, Card, CardHeader, EmptyState, PageHeader, StatCard, fmtDate, fmtNum, cap } from '../../components/ui';
import { CategoryPie, TrendChart } from '../../components/charts';
import { useWallet } from '../../context/WalletContext';

export default function Overview() {
  const { user } = useAuth();
  const toast = useToast();
  const wallet = useWallet();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/citizen/overview').then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  }, []);

  const s = data?.stats;
  const loading = !data;

  return (
    <>
      <PageHeader
        title={`Hello, ${user.fullName.split(' ')[0]}`}
        subtitle="Here is how your recycling is going."
        action={<Link to="/app/submit" className="btn btn-primary"><Plus className="h-4 w-4" /> Submit recycling</Link>}
      />

      {!user.walletAddress && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <span className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Link your MetaMask wallet so you can receive ECO rewards.</span>
          <Link to="/app/wallet" className="btn btn-outline py-1.5">Link wallet</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} icon={ListChecks} label="Total activities" value={s && fmtNum(s.totalActivities, 0)} hint={s && `${s.pending} pending`} />
        <StatCard loading={loading} icon={Coins} label="ECO earned (confirmed)" value={s && fmtNum(s.tokensEarned, 2)} hint={wallet.ecoBalance !== null ? `Wallet balance: ${fmtNum(wallet.ecoBalance, 2)} ECO` : 'Connect MetaMask to see wallet balance'} />
        <StatCard loading={loading} icon={Recycle} label="Verified waste" value={s && `${fmtNum(s.verifiedKg, 1)} kg`} />
        <StatCard loading={loading} icon={Medal} label="Leaderboard rank" value={s && (s.rank ? `#${s.rank}` : '·')} hint={s && (s.rank ? `of ${s.participants} recyclers` : 'Get a submission approved to rank')} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recycling performance" subtitle="Verified kilograms per month" />
          <div className="p-5">{loading ? <div className="skeleton h-64" /> : <TrendChart data={data.monthly} />}</div>
        </Card>
        <Card>
          <CardHeader title="By category" subtitle="Verified kg" />
          <div className="p-5">
            {loading ? <div className="skeleton h-64" /> : data.categories.some((c) => c.verifiedKg > 0) ? <CategoryPie data={data.categories} /> : <EmptyState icon={Recycle} title="No verified recycling yet" text="Approved submissions appear here." />}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activities" action={<Link to="/app/activities" className="text-sm font-semibold text-emerald">View all <ArrowRight className="inline h-3.5 w-3.5" /></Link>} />
          {loading ? <div className="skeleton m-5 h-40" /> : data.recentActivities.length === 0 ? (
            <EmptyState title="Nothing submitted yet" text="Your first recycling submission will show up here." action={<Link to="/app/submit" className="btn btn-primary">Submit recycling</Link>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div><p className="text-sm font-semibold">{cap(a.wasteCategory)} · {a.quantityKg} kg</p><p className="text-xs text-muted">{fmtDate(a.recyclingDate)} · {a.collectionLocation}</p></div>
                  <Badge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Pending submissions" subtitle="Waiting for administrator review" />
          {loading ? <div className="skeleton m-5 h-40" /> : data.pendingActivities.length === 0 ? (
            <EmptyState icon={Clock} title="Nothing pending" text="All your submissions have been reviewed." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.pendingActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm font-semibold">{cap(a.wasteCategory)} · {a.quantityKg} kg</p>
                  <span className="text-xs text-muted">{fmtDate(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent reward transactions" action={<Link to="/app/transactions" className="text-sm font-semibold text-emerald">All transactions <ArrowRight className="inline h-3.5 w-3.5" /></Link>} />
          {loading ? <div className="skeleton m-5 h-24" /> : data.recentRewards.length === 0 ? (
            <EmptyState icon={Coins} title="No rewards yet" text="When an approved submission is rewarded on-chain, it will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentRewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div><p className="text-sm font-semibold">+{fmtNum(r.tokenAmount, 3)} ECO</p><p className="text-xs text-muted">{fmtDate(r.createdAt)}</p></div>
                  <Badge status={r.transactionStatus} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <p className="mb-3 text-sm font-semibold">Quick actions</p>
        <div className="flex flex-wrap gap-3">
          <Link to="/app/submit" className="btn btn-primary"><Plus className="h-4 w-4" /> Submit recycling</Link>
          <Link to="/app/wallet" className="btn btn-outline"><Wallet className="h-4 w-4" /> My wallet</Link>
          <Link to="/app/leaderboard" className="btn btn-outline"><Medal className="h-4 w-4" /> Leaderboard</Link>
        </div>
      </Card>
    </>
  );
}
