import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileCheck2, Coins, Inbox, Recycle, Search, Users, Clock, CheckCircle2, Link2, ArrowRight, Scale } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useWallet, shortAddr } from '../../context/WalletContext';
import { downloadCsv } from '../../utils/csv';
import { CategoryPie, SimpleBars, TrendChart } from '../../components/charts';
import {
  Badge, Button, Card, CardHeader, DemoBadge, EmptyState, Field, PageHeader, SkeletonRows, StatCard,
  Table, TxLink, fmtDate, fmtNum, cap,
} from '../../components/ui';

function useGet(url, deps = []) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const reload = () => api.get(url).then((r) => setData(r.data)).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { reload(); }, deps);
  return [data, reload];
}

// ------------------------------------------------------------------ Overview
export function AdminOverview() {
  const [d] = useGet('/admin/overview');
  const s = d?.stats;
  const l = !d;
  return (
    <>
      <PageHeader title="Administrator overview" subtitle="Platform activity at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard loading={l} icon={Users} label="Registered citizens" value={s && fmtNum(s.citizens, 0)} />
        <StatCard loading={l} icon={FileCheck2} label="Total submissions" value={s && fmtNum(s.submissions, 0)} />
        <StatCard loading={l} icon={Clock} label="Pending verification" value={s && fmtNum(s.pending, 0)} />
        <StatCard loading={l} icon={CheckCircle2} label="Approved submissions" value={s && fmtNum(s.approved, 0)} />
        <StatCard loading={l} icon={Recycle} label="Verified waste" value={s && `${fmtNum(s.verifiedKg, 1)} kg`} />
        <StatCard loading={l} icon={Coins} label="ECO distributed (confirmed)" value={s && fmtNum(s.tokensDistributed, 2)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recycling activity trend" subtitle="Verified kg per month" />
          <div className="p-5">{l ? <div className="skeleton h-64" /> : <TrendChart data={d.monthly} />}</div>
        </Card>
        <Card>
          <CardHeader title="Waste categories" />
          <div className="p-5">{l ? <div className="skeleton h-64" /> : d.categories.some((c) => c.verifiedKg > 0) ? <CategoryPie data={d.categories} /> : <EmptyState icon={Recycle} title="No verified waste yet" />}</div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pending verification queue" action={<Link to="/admin/submissions" className="text-sm font-semibold text-emerald">View all <ArrowRight className="inline h-3.5 w-3.5" /></Link>} />
          {l ? <SkeletonRows rows={3} /> : d.pendingQueue.length === 0 ? <EmptyState icon={CheckCircle2} title="Queue is clear" text="No submissions are waiting for review." /> : (
            <ul className="divide-y divide-slate-100">
              {d.pendingQueue.map((x) => (
                <li key={x.id}>
                  <Link to={`/admin/submissions/${x.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
                    <div><p className="text-sm font-semibold">{cap(x.wasteCategory)} · {x.quantityKg} kg</p><p className="text-xs text-muted">{x.citizen.fullName} · {fmtDate(x.createdAt)}</p></div>
                    <span className="text-sm font-semibold text-emerald">Review</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent citizen registrations" />
          {l ? <SkeletonRows rows={3} /> : (
            <ul className="divide-y divide-slate-100">
              {d.recentCitizens.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div><p className="text-sm font-semibold">{u.fullName} {u.isDemo && <DemoBadge />}</p><p className="text-xs text-muted">{u.email}</p></div>
                  <span className="text-xs text-muted">{fmtDate(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent submissions" />
          {l ? <SkeletonRows rows={3} /> : d.recentSubmissions.length === 0 ? <EmptyState title="No submissions yet" /> : (
            <ul className="divide-y divide-slate-100">
              {d.recentSubmissions.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div><p className="text-sm font-semibold">{cap(x.wasteCategory)} · {x.quantityKg} kg</p><p className="text-xs text-muted">{x.citizen.fullName}</p></div>
                  <Badge status={x.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent blockchain transactions" />
          {l ? <SkeletonRows rows={3} /> : d.recentRewards.length === 0 ? <EmptyState icon={Link2} title="No transactions yet" text="Reward transactions appear here once you authorise them." /> : (
            <ul className="divide-y divide-slate-100">
              {d.recentRewards.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div><p className="text-sm font-semibold">{fmtNum(r.tokenAmount, 3)} ECO → {r.citizenName}</p><TxLink hash={r.transactionHash} base={d.explorerBaseUrl} /></div>
                  <Badge status={r.transactionStatus} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Submissions list
const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REWARD_PROCESSING', 'REWARDED'];
export function AdminSubmissions() {
  const [d] = useGet('/admin/submissions');
  const [filter, setFilter] = useState('PENDING');
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    if (!d) return [];
    const t = q.trim().toLowerCase();
    return d.submissions.filter((s) => (filter === 'ALL' || s.status === filter) &&
      (!t || s.id.toLowerCase().includes(t) || s.citizen.fullName.toLowerCase().includes(t) || s.citizen.email.toLowerCase().includes(t)));
  }, [d, filter, q]);
  return (
    <>
      <PageHeader title="Recycling submissions" subtitle="Open a submission to inspect its evidence and verify it." />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search ID, citizen name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f ? 'bg-forest text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}>{f === 'ALL' ? 'All' : f === 'REWARD_PROCESSING' ? 'Processing' : cap(f)}</button>)}
          </div>
        </div>
        {!d ? <SkeletonRows /> : rows.length === 0 ? <EmptyState icon={Inbox} title="No submissions found" text="Nothing matches this filter." /> : (
          <Table head={['Citizen', 'Category', 'Quantity', 'Date', 'Evidence', 'Status', '']}>
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="td"><p className="font-semibold">{s.citizen.fullName}</p><p className="text-xs text-muted">{s.citizen.email}</p></td>
                <td className="td">{cap(s.wasteCategory)}</td>
                <td className="td">{s.quantityKg} kg</td>
                <td className="td">{fmtDate(s.createdAt)}</td>
                <td className="td">{s.evidenceUrl ? 'Yes' : <span className="text-muted">None</span>}</td>
                <td className="td"><Badge status={s.status} /></td>
                <td className="td text-right"><Link to={`/admin/submissions/${s.id}`} className="btn btn-outline py-1.5">{s.status === 'PENDING' ? 'Review' : 'Open'}</Link></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Citizens
export function AdminCitizens() {
  const toast = useToast();
  const [d, reload] = useGet('/admin/citizens');
  const [q, setQ] = useState('');
  const rows = (d?.citizens || []).filter((c) => !q.trim() || c.fullName.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()));
  const toggle = async (c) => {
    const next = c.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`${next === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} ${c.fullName}?`)) return;
    try { await api.patch(`/admin/citizens/${c.id}/status`, { accountStatus: next }); toast.success('Account updated'); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <>
      <PageHeader title="Manage citizens" subtitle="Registered citizens and their contributions." />
      <Card>
        <div className="border-b border-slate-100 p-4"><div className="relative sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input className="input pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        {!d ? <SkeletonRows /> : rows.length === 0 ? <EmptyState icon={Users} title="No citizens found" /> : (
          <Table head={['Citizen', 'Registered', 'Wallet', 'Verified', 'ECO earned', 'Status', '']}>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="td"><p className="font-semibold">{c.fullName} {c.isDemo && <DemoBadge />}</p><p className="text-xs text-muted">{c.email}</p></td>
                <td className="td">{fmtDate(c.createdAt)}</td>
                <td className="td font-mono text-xs">{c.walletAddress ? shortAddr(c.walletAddress) : <span className="font-sans text-muted">Not linked</span>}</td>
                <td className="td">{c.verifiedSubmissions} · {fmtNum(c.verifiedKg, 1)} kg</td>
                <td className="td font-semibold text-emerald">{fmtNum(c.tokensEarned, 2)}</td>
                <td className="td"><Badge status={c.accountStatus} /></td>
                <td className="td text-right"><Button variant="outline" className="py-1.5" onClick={() => toggle(c)}>{c.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Token distribution + blockchain records
export function AdminTokens() {
  const toast = useToast();
  const [d, reload] = useGet('/admin/rewards');
  const refresh = async (id) => {
    try { const { data } = await api.post(`/admin/rewards/${id}/refresh`); toast.info(`Status: ${data.reward.transactionStatus}`); reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const s = d?.summary;
  return (
    <>
      <PageHeader title="Token distribution" subtitle="ECO reward transactions issued by the smart contract." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={!d} icon={Coins} label="Total distributed" value={s && `${fmtNum(s.totalDistributed, 2)} ECO`} />
        <StatCard loading={!d} icon={CheckCircle2} label="Successful" value={s && s.confirmed} />
        <StatCard loading={!d} icon={Clock} label="Pending" value={s && s.pending} />
        <StatCard loading={!d} icon={Scale} label="Failed" value={s && s.failed} />
      </div>
      <Card className="mt-6">
        <CardHeader title="Reward history" />
        {!d ? <SkeletonRows /> : d.rewards.length === 0 ? <EmptyState icon={Coins} title="No rewards issued yet" text="Approve a submission, then authorise its reward from the verification page." /> : (
          <Table head={['Date', 'Citizen', 'Category', 'Tokens', 'Status', 'Transaction', '']}>
            {d.rewards.map((r) => (
              <tr key={r.id}>
                <td className="td">{fmtDate(r.createdAt)}</td>
                <td className="td">{r.citizenName}</td>
                <td className="td">{cap(r.wasteCategory)}</td>
                <td className="td font-semibold">{fmtNum(r.tokenAmount, 3)}</td>
                <td className="td"><Badge status={r.transactionStatus} />{r.failureReason && <p className="mt-1 max-w-[200px] text-[11px] text-muted">{r.failureReason}</p>}</td>
                <td className="td"><TxLink hash={r.transactionHash} base={d.explorerBaseUrl} /></td>
                <td className="td text-right">{r.transactionStatus === 'PROCESSING' && <Button variant="outline" className="py-1.5" onClick={() => refresh(r.id)}>Refresh</Button>}{r.transactionStatus === 'FAILED' && <Link to={`/admin/submissions/${r.submissionId}`} className="btn btn-outline py-1.5">Retry</Link>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

export function AdminBlockchain() {
  const [d] = useGet('/admin/rewards');
  const { config } = useWallet();
  return (
    <>
      <PageHeader title="Blockchain records" subtitle="Every reward transaction recorded by the platform." />
      <Card className="mb-6 p-5">
        <p className="text-sm text-muted">Reward contract</p>
        {config.contractAddress ? (
          <a className="mt-1 inline-block break-all font-mono text-sm text-emerald hover:underline" href={`${config.explorerBaseUrl}/address/${config.contractAddress}`} target="_blank" rel="noreferrer">{config.contractAddress}</a>
        ) : <p className="mt-1 text-sm text-amber-700">Not configured yet. Set CONTRACT_ADDRESS in server/.env after deploying.</p>}
      </Card>
      <Card>
        {!d ? <SkeletonRows /> : d.rewards.length === 0 ? <EmptyState icon={Link2} title="No blockchain records yet" /> : (
          <Table head={['Transaction hash', 'Citizen wallet', 'Submission', 'Tokens', 'Date', 'Status']}>
            {d.rewards.map((r) => (
              <tr key={r.id}>
                <td className="td"><TxLink hash={r.transactionHash} base={d.explorerBaseUrl} /></td>
                <td className="td font-mono text-xs">{shortAddr(r.walletAddress)}</td>
                <td className="td font-mono text-xs"><Link className="text-emerald hover:underline" to={`/admin/submissions/${r.submissionId}`}>{r.submissionId.slice(0, 8)}…</Link></td>
                <td className="td font-semibold">{fmtNum(r.tokenAmount, 3)}</td>
                <td className="td">{fmtDate(r.createdAt)}</td>
                <td className="td"><Badge status={r.transactionStatus} /></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Reports
export function AdminReports() {
  const [d] = useGet('/admin/reports');
  const [subs] = useGet('/admin/submissions');
  const t = d?.totals;
  const exportSubs = () => downloadCsv(`ecochain-submissions-${new Date().toISOString().slice(0, 10)}.csv`, (subs?.submissions || []).map((s) => ({
    id: s.id, citizen: s.citizen.fullName, email: s.citizen.email, category: s.wasteCategory, kg: s.quantityKg, location: s.collectionLocation,
    recyclingDate: s.recyclingDate, submittedAt: s.createdAt, status: s.status, rejectionReason: s.rejectionReason || '',
    tokens: s.reward?.tokenAmount ?? '', transactionHash: s.reward?.transactionHash ?? '',
  })));
  const exportMonthly = () => downloadCsv('ecochain-monthly-report.csv', d.monthly);
  return (
    <>
      <PageHeader title="Reports & analytics" subtitle="Recycling and reward statistics." action={
        <div className="flex gap-2"><Button variant="outline" onClick={exportMonthly} disabled={!d}><Download className="h-4 w-4" /> Monthly CSV</Button><Button onClick={exportSubs} disabled={!subs?.submissions?.length}><Download className="h-4 w-4" /> Submissions CSV</Button></div>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={!d} icon={Recycle} label="Total waste recycled" value={t && `${fmtNum(t.verifiedKg, 1)} kg`} />
        <StatCard loading={!d} icon={Users} label="Citizen participation" value={t && `${t.participationRate}%`} hint={t && `${t.participants} of ${t.citizens} citizens`} />
        <StatCard loading={!d} icon={Coins} label="ECO distributed" value={t && fmtNum(t.tokensDistributed, 2)} />
        <StatCard loading={!d} icon={FileCheck2} label="Approved vs rejected" value={t && `${t.approved} / ${t.rejected}`} hint={t && `${t.pending} pending`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card><CardHeader title="Monthly recycling (last 12 months)" subtitle="Verified kg and submissions" />
          <div className="p-5">{!d ? <div className="skeleton h-64" /> : <SimpleBars data={d.monthly.map((m) => ({ ...m, label: m.month.slice(2) }))} xKey="label" bars={[{ key: 'verifiedKg', name: 'Verified kg', color: '#16A34A' }, { key: 'submissions', name: 'Submissions', color: '#14532D' }]} />}</div></Card>
        <Card><CardHeader title="Recycling by category" subtitle="Verified kg" />
          <div className="p-5">{!d ? <div className="skeleton h-64" /> : d.categories.some((c) => c.verifiedKg > 0) ? <CategoryPie data={d.categories} /> : <EmptyState icon={Recycle} title="No verified waste yet" />}</div></Card>
        <Card><CardHeader title="Token distribution by month" />
          <div className="p-5">{!d ? <div className="skeleton h-64" /> : <TrendChart data={d.monthly} dataKey="tokens" name="ECO tokens" />}</div></Card>
        <Card><CardHeader title="Submissions by outcome" />
          <div className="p-5">{!d ? <div className="skeleton h-64" /> : <SimpleBars data={[{ name: 'Approved', value: t.approved }, { name: 'Rejected', value: t.rejected }, { name: 'Pending', value: t.pending }]} xKey="name" bars={[{ key: 'value', name: 'Submissions', color: '#16A34A' }]} />}</div></Card>
      </div>
    </>
  );
}

// ------------------------------------------------------------------ Settings
export function AdminSettings() {
  const toast = useToast();
  const [d] = useGet('/admin/settings');
  const [rates, setRates] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (d) setRates(d.rates); }, [d]);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await api.put('/admin/settings/rates', rates); toast.success('Estimate rates saved'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHeader title="Settings" subtitle="Reward configuration and platform status." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Reward rates (ECO per kg)" subtitle="Demonstration values" />
          {!rates ? <SkeletonRows rows={4} /> : (
            <form onSubmit={save} className="space-y-4 p-5">
              {d.categories.map((c) => (
                <Field key={c} label={cap(c)}><input className="input" type="number" min="1" max="1000" step="1" value={rates[c]} onChange={(e) => setRates({ ...rates, [c]: e.target.value })} /></Field>
              ))}
              <Button type="submit" loading={busy}>Save rates</Button>
            </form>
          )}
        </Card>
        <Card>
          <CardHeader title="System status" />
          <div className="space-y-3 p-5 text-sm">
            <p className="flex justify-between"><span className="text-muted">Contract address</span><span className="font-mono text-xs">{d?.contractAddress ? shortAddr(d.contractAddress) : 'Not configured'}</span></p>
            <p className="flex justify-between"><span className="text-muted">Network chain ID</span><span>{d?.chainId}</span></p>
            <p className="flex justify-between"><span className="text-muted">Server RPC (receipt checks)</span>{d?.rpcConfigured ? <Badge status="CONFIRMED">Configured</Badge> : <Badge status="FAILED">Missing</Badge>}</p>
          </div>
        </Card>
      </div>
    </>
  );
}
