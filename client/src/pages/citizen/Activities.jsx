import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Search } from 'lucide-react';
import api, { errMsg } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { Badge, Card, EmptyState, PageHeader, SkeletonRows, Table, fmtDate, cap } from '../../components/ui';

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'REWARD_PROCESSING', 'REWARDED'];
const FILTER_LABEL = { ALL: 'All', PENDING: 'Pending', APPROVED: 'Approved', REJECTED: 'Rejected', REWARD_PROCESSING: 'Reward processing', REWARDED: 'Rewarded' };

function rewardLabel(s) {
  if (s.status === 'REWARDED') return `${s.reward?.tokenAmount ?? ''} ECO received`;
  if (s.status === 'REWARD_PROCESSING') return 'Processing on-chain';
  if (s.status === 'APPROVED') return 'Awaiting reward';
  if (s.status === 'REJECTED') return 'Not eligible';
  return 'After approval';
}

export default function Activities() {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/citizen/submissions').then((r) => setRows(r.data.submissions)).catch((e) => { toast.error(errMsg(e)); setRows([]); });
  }, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    const term = q.trim().toLowerCase();
    return rows.filter((s) => (filter === 'ALL' || s.status === filter) &&
      (!term || s.id.toLowerCase().includes(term) || s.wasteCategory.toLowerCase().includes(term) || s.collectionLocation.toLowerCase().includes(term)));
  }, [rows, filter, q]);

  return (
    <>
      <PageHeader title="My activities" subtitle="Every recycling submission and its verification status." action={<Link to="/app/submit" className="btn btn-primary">New submission</Link>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search by ID, category or location" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-forest text-white' : 'bg-slate-100 text-muted hover:bg-slate-200'}`}>{FILTER_LABEL[f]}</button>
            ))}
          </div>
        </div>
        {rows === null ? <SkeletonRows /> : shown.length === 0 ? (
          <EmptyState icon={ListChecks} title={rows.length ? 'No matching activities' : 'No activities yet'} text={rows.length ? 'Try a different search or filter.' : 'Submit your first recycling activity to get started.'} />
        ) : (
          <Table head={['ID', 'Category', 'Quantity', 'Submitted', 'Status', 'Reward', 'Notes']}>
            {shown.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="td font-mono text-xs text-muted" title={s.id}>{s.id.slice(0, 8)}…</td>
                <td className="td font-medium">{cap(s.wasteCategory)}</td>
                <td className="td">{s.quantityKg} kg</td>
                <td className="td">{fmtDate(s.createdAt)}</td>
                <td className="td"><Badge status={s.status} /></td>
                <td className="td text-muted">{rewardLabel(s)}</td>
                <td className="td max-w-[220px] text-xs text-red-600">{s.rejectionReason}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
